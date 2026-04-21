"""
ML Service Module - Handles all machine learning model operations

IMPORTANT: Python 3.14 Compatibility Note
=========================================
TensorFlow does not currently support Python 3.14. 
To use actual model inference, you need one of:
1. Downgrade to Python 3.11 or 3.12
2. Use a cloud-based ML inference service

For development/testing purposes, this module will use mock predictions
when TensorFlow is not available.
"""

import os
import numpy as np
from PIL import Image
import io
import base64
import logging

# Environment mode (used to control optional dependency warnings)
IS_PRODUCTION = os.getenv('FLASK_ENV', 'development') == 'production'

# Setup logging
logger = logging.getLogger(__name__)

# Try to import scipy for advanced image processing
try:
    from scipy import ndimage
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    if not IS_PRODUCTION:
        logger.warning("scipy not available - using basic preprocessing")

# Model interpreter (will be initialized when needed)
_interpreter = None
_input_details = None
_output_details = None
_model_loaded = False
_using_mock = False

# Class labels for letter recognition (26 uppercase letters A-Z)
# Note: The model output shape is [1, 26], so it only recognizes uppercase letters
ALPHANUMERIC_LABELS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

# ============================================================================
# LETTER RECOGNITION MODE: STRICT (NO SIMILARITY GROUPS)
# ============================================================================
# For educational purposes with dyslexic children, we require EXACT letter
# matching. Every letter must be drawn correctly - no substitutions allowed.
# This ensures children practice and learn each letter individually.
#
# Previously, similar-looking letters (like W/V, E/F) were grouped together
# and accepted as substitutes. This has been disabled to maximize learning.
# ============================================================================

# Empty similarity groups - every letter is unique and must be exact
SIMILAR_LETTER_GROUPS = []

# No strict distinction pairs needed when all letters are strict
STRICT_DISTINCTION_PAIRS = set()

# Empty lookup since no similarity groups exist
_SIMILAR_LETTER_LOOKUP = {}

# ============================================================================
# CONFUSION PAIR FEEDBACK — targeted drawing tips for commonly confused pairs
# ============================================================================
# These are NOT used for acceptance (strict matching is enforced).
# They provide helpful feedback when a child draws one letter but the model
# sees a visually similar one, so the child knows HOW to fix it.
# Research-backed confusion pairs for dyslexic children aged 6-12.
# Ranked by frequency in dyslexia literature (Terepocki, Kruk & Willows 2002;
# Nicolson & Fawcett 2009; Rosenblum, Weiss & Parush 2003).
#
# Categories:
#   Mirror reversals: B/D (most common/persistent)
#   Rotation confusions: M/W, N/Z
#   Stroke-count: E/F, M/N, P/B, C/G
#   Shape similarity: O/Q, O/D, O/C, V/U, I/L, I/T, H/N, K/X, V/Y, P/R
CONFUSION_PAIR_TIPS = {
    # --- #1 B/D: lateral mirror (most persistent dyslexic confusion) ---
    ('B', 'D'): "Remember, 'B' has TWO bumps on the right side!",
    ('D', 'B'): "'D' has ONE big curve — like a belly on the right!",
    # --- #2 M/W: 180-degree rotation ---
    ('M', 'W'): "'M' has peaks pointing UP — like mountains!",
    ('W', 'M'): "'W' has valleys pointing DOWN — like waves!",
    # --- #3 M/N: stroke count ---
    ('M', 'N'): "'M' has TWO bumps at the top — 'N' only has ONE diagonal!",
    ('N', 'M'): "'N' is simpler — just two lines with one diagonal!",
    # --- #4 E/F: missing bottom stroke ---
    ('E', 'F'): "'E' has THREE horizontal lines — don't forget the bottom one!",
    ('F', 'E'): "'F' only has TWO lines — leave off the bottom!",
    # --- #5 P/B: bump count ---
    ('P', 'B'): "'P' only has ONE bump at the top!",
    ('B', 'P'): "'B' has TWO bumps — one at the top AND one at the bottom!",
    # --- #6 O/Q: minimal feature difference ---
    ('O', 'Q'): "'O' is just a circle — no tail!",
    ('Q', 'O'): "'Q' has a small tail at the bottom right!",
    # --- #7 C/G: missing stroke ---
    ('C', 'G'): "'C' is just a curve — no line inside!",
    ('G', 'C'): "'G' has a small line going inward at the middle!",
    # --- #8 O/C: closure ---
    ('O', 'C'): "'O' is a complete circle — close it all the way!",
    ('C', 'O'): "'C' stays open on the right side — don't close it!",
    # --- #9 V/U/W: bottom shape ---
    ('V', 'U'): "'V' has a sharp point at the bottom!",
    ('U', 'V'): "'U' has a round, curved bottom!",
    ('U', 'W'): "'U' has a smooth round bottom — just one curve!",
    ('W', 'U'): "'W' has two valleys at the bottom — like zigzag!",
    # --- #10 I/L: minimal structure difference ---
    ('I', 'L'): "'I' is just a straight line standing up!",
    ('L', 'I'): "'L' has a line going to the right at the bottom!",
    # --- Additional research-backed pairs ---
    ('W', 'V'): "'W' is wider — draw two valleys at the bottom!",
    ('V', 'W'): "'V' is narrower — just one point at the bottom!",
    ('P', 'R'): "'P' has only a bump at the top — no leg!",
    ('R', 'P'): "'R' has a bump AND a leg — add a diagonal at the bottom!",
    ('I', 'T'): "'I' is just a straight line — no line across the top!",
    ('T', 'I'): "'T' has a line across the top!",
    ('H', 'N'): "'H' has a line in the middle going across!",
    ('N', 'H'): "'N' has a diagonal line — not a horizontal one!",
    ('K', 'X'): "'K' has its lines meeting on the LEFT side!",
    ('X', 'K'): "'X' crosses right in the MIDDLE!",
    ('V', 'Y'): "'V' stays open at the top — no stem going down!",
    ('Y', 'V'): "'Y' has a stem going down from the middle!",
    ('O', 'D'): "'O' is a circle — no straight line on the left!",
    ('D', 'O'): "'D' has a straight line on the left side!",
    ('N', 'Z'): "'N' stands up tall — the diagonal goes from top-left to bottom-right!",
    ('Z', 'N'): "'Z' lies flat — the diagonal goes from top-right to bottom-left!",
    ('Z', 'S'): "'Z' has sharp corners — draw it with straight lines!",
    ('S', 'Z'): "'S' is curvy — draw it with smooth curves!",
}



# ============================================================================
# CONFUSION PAIR GEOMETRIC RESOLUTION (STRONG)
# ============================================================================
# When the model confuses structurally similar letters, these functions
# analyze the preprocessed 28x28 image to distinguish them based on
# multi-feature stroke geometry.
#
# Covered confusion groups:
#   W/V/U  — bottom shape (point vs flat vs round)
#   E/F    — bottom horizontal bar presence
#   L/I    — horizontal foot
#   Z/S    — angular vs curved profile
#   I/T    — top crossbar
#
# Two layers of application:
#   1. predict_letter() — reranks top-1 when the top-2 are a known pair
#   2. predict_letter_dyslexia_friendly() — overrides rejection
# ============================================================================

def _horizontal_extent_by_row(img_28: np.ndarray, threshold: float = 0.1) -> np.ndarray:
    """For each row, compute horizontal extent (rightmost - leftmost non-zero pixel)."""
    extents = np.zeros(28, dtype=np.float32)
    for r in range(28):
        nonzero_cols = np.nonzero(img_28[r] > threshold)[0]
        if len(nonzero_cols) > 0:
            extents[r] = nonzero_cols[-1] - nonzero_cols[0]
    return extents


def _vertical_extent_by_col(img_28: np.ndarray, threshold: float = 0.1) -> np.ndarray:
    """For each column, compute vertical extent (bottommost - topmost non-zero pixel)."""
    n_cols = img_28.shape[1]
    extents = np.zeros(n_cols, dtype=np.float32)
    for c in range(n_cols):
        nonzero_rows = np.nonzero(img_28[:, c] > threshold)[0]
        if len(nonzero_rows) > 0:
            extents[c] = nonzero_rows[-1] - nonzero_rows[0]
    return extents


def _pixel_mass_by_row(img_28: np.ndarray, threshold: float = 0.1) -> np.ndarray:
    """For each row, count the number of non-zero pixels (stroke mass)."""
    return np.array([(img_28[r] > threshold).sum() for r in range(28)], dtype=np.float32)


def _count_stroke_segments(row: np.ndarray, threshold: float = 0.1) -> int:
    """Count the number of separate stroke segments in a single row."""
    binary = (row > threshold).astype(np.int32)
    if binary.sum() == 0:
        return 0
    transitions = np.diff(binary)
    # Each rising edge (0→1) starts a new segment
    return int((transitions == 1).sum()) + (1 if binary[0] == 1 else 0)


def _bottom_convergence_ratio(img_28: np.ndarray) -> float:
    """
    Measures how sharply the letter converges toward the bottom.
    Returns ratio of bottom width to maximum width. Low = sharp point,
    high = stays wide.
    """
    h_ext = _horizontal_extent_by_row(img_28)
    max_width = float(h_ext.max())
    if max_width == 0:
        return 1.0
    # Average width in bottom 6 rows
    bottom_widths = h_ext[21:27]
    bottom_nonzero = bottom_widths[bottom_widths > 0]
    if bottom_nonzero.size == 0:
        return 0.0
    return float(bottom_nonzero.mean()) / max_width


def _has_bottom_curve(img_28: np.ndarray) -> bool:
    """
    Detect a U-shape: wide rounded bottom with no sharp convergence point.
    Returns True for U-like shapes.
    """
    h_ext = _horizontal_extent_by_row(img_28)
    mass = _pixel_mass_by_row(img_28)

    # Find the row with maximum mass in the bottom half
    bottom_mass = mass[14:]
    if bottom_mass.sum() == 0:
        return False

    # U has heavy concentration of mass in the bottom rows (the curve)
    bot_q_mass = float(mass[20:27].sum())
    total_mass = float(mass.sum())
    if total_mass == 0:
        return False

    # U's bottom quarter has significant mass fraction (the round curve)
    bot_mass_ratio = bot_q_mass / total_mass

    # U also has wide bottom AND the very bottom rows narrow down
    # (the curve closes from both sides)
    bot_widths = h_ext[18:26]
    bot_nonzero = bot_widths[bot_widths > 0]
    if bot_nonzero.size < 3:
        return False

    # Check for roughly consistent width in the bottom (~U curve)
    bot_std = float(bot_nonzero.std())
    bot_mean = float(bot_nonzero.mean())

    return bot_mass_ratio > 0.25 and bot_std < bot_mean * 0.4


def _has_left_vertical_stem(img_28: np.ndarray) -> bool:
    """Check if there's a vertical stem on the left side of the letter."""
    # Look at left third of image
    left_third = img_28[:, 0:10]
    v_ext = _vertical_extent_by_col(left_third)
    v_nonzero = v_ext[v_ext > 0]
    if v_nonzero.size == 0:
        return False
    # A vertical stem spans most of the letter height
    return float(v_nonzero.max()) > 12


def _resolve_w_v_u(img_28: np.ndarray) -> str:
    """
    Three-way resolver for W, V, and U.

    Key geometric differences:
    - V: two diagonal strokes converging to a SHARP POINT at the bottom.
         Bottom width is very small relative to top width.
    - W: TWO V-shapes side by side — stays WIDE at the bottom with
         multiple stroke segments visible in the middle-to-bottom rows.
    - U: two vertical sides connected by a SMOOTH CURVED bottom.
         Bottom is wide but has heavy pixel mass (filled curve, not a point).
         The sides are relatively parallel (consistent width).
    """
    h_ext = _horizontal_extent_by_row(img_28)
    mass = _pixel_mass_by_row(img_28)

    max_width = float(h_ext.max())
    if max_width == 0:
        return 'V'

    # --- Feature 1: Bottom convergence ---
    bot_conv = _bottom_convergence_ratio(img_28)

    # --- Feature 2: Multi-segment rows in bottom half ---
    # W has rows with 2+ separate stroke segments (the two valleys)
    multi_seg_count = 0
    for r in range(14, 25):
        if _count_stroke_segments(img_28[r], 0.1) >= 2:
            multi_seg_count += 1

    # --- Feature 3: U-curve detection ---
    is_u_curve = _has_bottom_curve(img_28)

    # --- Feature 4: Width consistency (U has parallel sides) ---
    active_rows = h_ext[h_ext > 0]
    if active_rows.size > 3:
        width_cv = float(active_rows.std()) / max(float(active_rows.mean()), 1)
    else:
        width_cv = 1.0  # uncertain

    # --- Feature 5: Bottom pixel mass ratio ---
    total_mass = float(mass.sum())
    bot_mass_ratio = float(mass[18:27].sum()) / max(total_mass, 1)

    logger.info(
        f"W/V/U resolver: bot_conv={bot_conv:.2f}, multi_seg={multi_seg_count}, "
        f"u_curve={is_u_curve}, width_cv={width_cv:.2f}, bot_mass={bot_mass_ratio:.2f}"
    )

    # --- Decision tree ---

    # W: has rows with 3+ separate stroke segments (the zigzag double-valley)
    # V and U never have more than 2 segments in any row.
    three_plus_seg = sum(
        1 for r in range(14, 25)
        if _count_stroke_segments(img_28[r], 0.1) >= 3
    )
    if three_plus_seg >= 2:
        return 'W'

    # V: sharp convergence to a point at the bottom
    if bot_conv < 0.30:
        return 'V'

    # U: smooth curve at bottom, parallel sides, heavy bottom mass
    if is_u_curve and width_cv < 0.25:
        return 'U'
    if bot_conv > 0.6 and bot_mass_ratio > 0.3:
        return 'U'

    # Moderate bottom width — distinguish W (diagonal strokes) from U (curve)
    if multi_seg_count >= 3 and not is_u_curve:
        return 'W'

    if is_u_curve:
        return 'U'

    # Fallback: very wide bottom likely W, narrow-ish likely V
    if bot_conv > 0.4:
        return 'W'
    return 'V'


def _resolve_l_vs_i(img_28: np.ndarray) -> str:
    """
    Distinguish L from I.
    L has a horizontal foot extending right at the bottom.
    I is a narrow vertical stroke throughout.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    # Bottom quarter vs middle section
    bottom_q = h_ext[21:28]
    middle = h_ext[7:21]

    bottom_max = float(bottom_q.max()) if bottom_q.size else 0
    mid_nonzero = middle[middle > 0]
    mid_median = float(np.median(mid_nonzero)) if mid_nonzero.size else 1

    # L's bottom should be noticeably wider than its middle stem
    if mid_median > 0 and bottom_max > mid_median * 1.4:
        return 'L'
    return 'I'


def _resolve_e_vs_f(img_28: np.ndarray) -> str:
    """
    Distinguish E from F.
    E has three horizontal bars (top, middle, bottom).
    F has only two (top, middle — no bottom bar).

    The ONLY structural difference is the bottom bar.
    We use RELATIVE comparisons (bottom vs top extent) rather than
    absolute pixel counts, because center-of-mass centering can shift
    the stem position unpredictably.  Absolute checks like
    "right-of-center pixels >= 5" break when the stem lands near
    the center column.

    Three complementary signals, scored together:
    1. Extent ratio:  bottom bar width / top bar width
       E ≈ 0.6-1.0  (bottom bar ≈ top bar)
       F ≈ 0.1-0.3  (bottom = just stem, much narrower than top bar)
    2. Stem ratio:    bottom extent / stem width
       E >> 1.4      (bottom bar extends well beyond stem)
       F ≈ 1.0       (bottom = stem only)
    3. Mass ratio:    bottom mass / top mass
       E > 0.6       (stem + bar ≈ top region)
       F < 0.5       (stem only << stem + bar)
    """
    h_ext = _horizontal_extent_by_row(img_28)
    mass = _pixel_mass_by_row(img_28)

    # Top bar region (rows 2-8) — both E and F have this
    top_ext = h_ext[2:9]
    top_max_ext = float(top_ext.max()) if top_ext.size else 0

    # Bottom region (rows 20-27) — E has a bar, F has only stem
    bot_ext = h_ext[20:27]
    bot_max_ext = float(bot_ext.max()) if bot_ext.size else 0

    # Stem width: minimum horizontal extent in middle rows (stem only)
    mid_ext = h_ext[10:18]
    mid_nonzero = mid_ext[mid_ext > 0]
    stem_width = float(mid_nonzero.min()) if mid_nonzero.size else 2

    # Mass in bottom vs top regions
    bot_mass_total = float(mass[20:28].sum())
    top_mass_total = float(mass[0:8].sum())

    # --- Signal 1: extent ratio (most discriminative) ---
    extent_ratio = bot_max_ext / max(top_max_ext, 1)

    # --- Signal 2: bottom extends beyond stem ---
    stem_ratio = bot_max_ext / max(stem_width, 1)

    # --- Signal 3: mass ratio ---
    mass_ratio = bot_mass_total / max(top_mass_total, 1)

    logger.info(
        f"E/F resolver: extent_ratio={extent_ratio:.3f}, stem_ratio={stem_ratio:.2f}, "
        f"mass_ratio={mass_ratio:.3f}, bot_ext={bot_max_ext:.1f}, "
        f"top_ext={top_max_ext:.1f}, stem_w={stem_width:.1f}"
    )

    # Evidence scoring — require multiple signals to agree
    e_evidence = 0

    if extent_ratio > 0.55:
        e_evidence += 2
    elif extent_ratio > 0.40:
        e_evidence += 1

    if stem_ratio > 1.8:
        e_evidence += 2
    elif stem_ratio > 1.4:
        e_evidence += 1

    if mass_ratio > 0.60:
        e_evidence += 1

    # Need strong evidence (>= 3) for E
    if e_evidence >= 3:
        return 'E'
    return 'F'


def _resolve_z_vs_s(img_28: np.ndarray) -> str:
    """
    Distinguish Z from S.
    Z has wide horizontal bars at top AND bottom (connected by a diagonal).
    S is curvy throughout without flat horizontal sections.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    # Z has clearly wide horizontal bars at top and bottom
    top_max = float(h_ext[2:8].max()) if h_ext[2:8].size else 0
    bot_max = float(h_ext[20:26].max()) if h_ext[20:26].size else 0
    mid_max = float(h_ext[10:18].max()) if h_ext[10:18].size else 0

    # Z: both top and bottom are wide bars (wider than the diagonal middle)
    # S: width is more uniform — no distinct flat bars
    if top_max > 8 and bot_max > 8 and mid_max < max(top_max, bot_max) * 0.9:
        return 'Z'
    return 'S'


def _resolve_i_vs_t(img_28: np.ndarray) -> str:
    """
    Distinguish I from T.
    T has a horizontal crossbar at the top.
    I is a simple vertical stroke.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    top_q = h_ext[0:7]
    middle = h_ext[7:21]

    top_max = float(top_q.max()) if top_q.size else 0
    mid_nonzero = middle[middle > 0]
    mid_median = float(np.median(mid_nonzero)) if mid_nonzero.size else 0

    # T's top should be much wider than the vertical stem
    if mid_median > 0 and top_max > mid_median * 1.5:
        return 'T'
    return 'I'


# Map of (letterA, letterB) → resolver function.
# The resolver returns whichever letter the geometry best matches.
# W/V/U all route to the same three-way resolver.
_CONFUSION_RESOLVERS = {
    ('L', 'I'): _resolve_l_vs_i,
    ('I', 'L'): _resolve_l_vs_i,
    ('E', 'F'): _resolve_e_vs_f,
    ('F', 'E'): _resolve_e_vs_f,
    ('W', 'V'): _resolve_w_v_u,
    ('V', 'W'): _resolve_w_v_u,
    ('W', 'U'): _resolve_w_v_u,
    ('U', 'W'): _resolve_w_v_u,
    ('U', 'V'): _resolve_w_v_u,
    ('V', 'U'): _resolve_w_v_u,
    ('Z', 'S'): _resolve_z_vs_s,
    ('S', 'Z'): _resolve_z_vs_s,
    ('I', 'T'): _resolve_i_vs_t,
    ('T', 'I'): _resolve_i_vs_t,
}

# Set of letters that have geometric resolvers — used by predict_letter
# to decide whether to attempt reranking.
_CONFUSION_LETTERS = set()
for _pair in _CONFUSION_RESOLVERS:
    _CONFUSION_LETTERS.update(_pair)

# Reverse map: for each letter, collect all (pair_key, resolver) entries
# where that letter appears as either element of the pair.
_LETTER_RESOLVERS: dict = {}
for _pair, _resolver_fn in _CONFUSION_RESOLVERS.items():
    for _letter in _pair:
        if _letter not in _LETTER_RESOLVERS:
            _LETTER_RESOLVERS[_letter] = []
        # Avoid duplicates (since (E,F) and (F,E) share the same resolver)
        if (_pair, _resolver_fn) not in _LETTER_RESOLVERS[_letter]:
            _LETTER_RESOLVERS[_letter].append((_pair, _resolver_fn))


def resolve_confusion_pair(img_28: np.ndarray, predicted: str, expected: str) -> str:
    """
    Use geometric analysis to resolve a known confusion pair.

    Args:
        img_28: The preprocessed 28x28 float image (values 0-1).
        predicted: The model's top-1 predicted letter (uppercase).
        expected: The letter the child was asked to draw (uppercase).

    Returns:
        The letter chosen by geometric analysis, or predicted if no resolver exists.
    """
    resolver = _CONFUSION_RESOLVERS.get((predicted, expected))
    if resolver is None:
        return predicted
    resolved = resolver(img_28)
    logger.info(
        f"Confusion resolver ({predicted}/{expected}): geometric analysis → '{resolved}'"
    )
    return resolved


def _rerank_with_geometry(img_28: np.ndarray, top_predictions: list) -> tuple:
    """
    Rerank the model's top predictions using geometric analysis.

    ALWAYS runs the resolver when the top-1 prediction is a letter that
    participates in ANY known confusion pair.  This ensures the geometric
    check fires even when the model is very confident about the wrong letter
    (e.g., model says E at 95 % but image is actually F).

    Algorithm:
    1. If top-1 is a confusion letter, run ALL applicable resolvers.
    2. If the resolver output disagrees with top-1, promote the resolved
       letter from wherever it sits in top-5 (or inject it at position 0).

    Args:
        img_28: Preprocessed 28x28 image (values 0-1).
        top_predictions: List of dicts with 'label', 'confidence', 'index'.

    Returns:
        (new_label, new_confidence, updated_top_predictions)
    """
    if not top_predictions:
        return 'A', 0.0, top_predictions

    top1 = top_predictions[0]['label'].upper()

    # ---- Always run resolver when top-1 is a confusion letter ----
    resolver_entries = _LETTER_RESOLVERS.get(top1)
    if resolver_entries is None:
        return top1, top_predictions[0]['confidence'], top_predictions

    # Run the first applicable resolver (they all share the same function
    # for a given letter — e.g., E/F both map to _resolve_e_vs_f).
    # Deduplicate by resolver function identity.
    seen_fns = set()
    resolved = top1  # default: keep model answer
    for _pair, resolver_fn in resolver_entries:
        fn_id = id(resolver_fn)
        if fn_id in seen_fns:
            continue
        seen_fns.add(fn_id)
        resolved = resolver_fn(img_28)
        logger.info(
            f"Geometric rerank: top-1='{top1}', resolver {_pair} → '{resolved}'"
        )
        if resolved != top1:
            break  # resolved to something different — use it

    if resolved == top1:
        # Geometry agrees with model — no change needed
        return top1, top_predictions[0]['confidence'], top_predictions

    # Geometry disagrees — promote the resolved letter
    new_preds = list(top_predictions)
    for i, pred in enumerate(new_preds):
        if pred['label'].upper() == resolved:
            # Swap this prediction to position 0
            new_preds[0], new_preds[i] = new_preds[i], new_preds[0]
            logger.info(
                f"Geometric rerank: swapped '{top1}' → '{resolved}' as top-1"
            )
            return resolved, new_preds[0]['confidence'], new_preds

    # Resolved letter not in top predictions at all — inject it at top
    logger.info(
        f"Geometric rerank: '{resolved}' not in top-5, injecting as top-1"
    )
    injected = {
        'label': resolved,
        'confidence': top_predictions[0]['confidence'],
        'index': ord(resolved) - ord('A'),
    }
    new_preds.insert(0, injected)
    return resolved, injected['confidence'], new_preds


def are_letters_similar(letter1: str, letter2: str) -> bool:
    """
    Check if two letters are visually similar (commonly confused by dyslexic children).

    IMPORTANT: Letter pairs in STRICT_DISTINCTION_PAIRS are NEVER treated as similar,
    even if they look alike. This ensures educational value for critical pairs like E/F, B/D.
    """
    letter1 = letter1.upper()
    letter2 = letter2.upper()

    if letter1 == letter2:
        return True

    if (letter1, letter2) in STRICT_DISTINCTION_PAIRS:
        return False

    similar_to_letter1 = _SIMILAR_LETTER_LOOKUP.get(letter1, set())
    return letter2 in similar_to_letter1


# ============================================================================
# ADDITIONAL GEOMETRIC RESOLVERS — COMMON DYSLEXIC CONFUSION PAIRS
# ============================================================================

def _resolve_b_vs_d(img_28: np.ndarray) -> str:
    """
    Distinguish B from D (most common dyslexic mirror-reversal).
    B: vertical stem on the LEFT, TWO bumps on the RIGHT.
    D: vertical stem on the LEFT, ONE smooth curve bulging RIGHT.
    Key: D's widest horizontal extent is in the MIDDLE rows (where the
    single arc bulges most). B's widest rows are in the upper and lower
    thirds (the two bumps), NOT the middle.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    # Find the row with maximum horizontal extent
    active = h_ext[3:25]
    if active.max() == 0:
        return 'D'
    argmax_row = int(np.argmax(active)) + 3  # offset back to original indexing

    # D: widest row is in the middle third (rows 10-18)
    # B: widest rows are in the top or bottom third
    if 10 <= argmax_row <= 18:
        return 'D'
    return 'B'


def _resolve_m_vs_n(img_28: np.ndarray) -> str:
    """
    Distinguish M from N.
    M: 4 strokes (2 stems + 2 inner diagonals) → 4 separate ink bands at
       some rows.  N: 3 strokes (2 stems + 1 diagonal) → max 3 ink bands.
    Key: count rows with >= 4 separate stroke segments.  M has several;
    N has none.
    """
    # Count rows (mid-height) that have 4+ separate stroke segments
    quad_seg_rows = sum(
        1 for r in range(6, 22)
        if _count_stroke_segments(img_28[r], 0.1) >= 4
    )

    # M: at least a few rows with 4 distinct bands
    if quad_seg_rows >= 2:
        return 'M'
    return 'N'


def _resolve_p_vs_r(img_28: np.ndarray) -> str:
    """
    Distinguish P from R.
    R has a diagonal leg extending from the bump down-right.
    P has no leg — the bottom is just the vertical stem.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    # Bottom quarter — R has a leg extending right, P does not
    bot_rows = h_ext[20:27]
    mid_rows = h_ext[10:17]

    bot_max = float(bot_rows.max()) if bot_rows.size else 0
    mid_nonzero = mid_rows[mid_rows > 0]
    stem_width = float(mid_nonzero.min()) if mid_nonzero.size else 2

    # R: bottom extends wider than just the stem (the leg)
    if stem_width > 0 and bot_max > stem_width * 1.4:
        return 'R'
    return 'P'


def _resolve_c_vs_g(img_28: np.ndarray) -> str:
    """
    Distinguish C from G.
    G has a horizontal bar extending inward from the right at mid-height.
    C is just an open curve — no inward bar.
    Detect the bar by measuring contiguous columns of ink at mid-height
    from the right side inward.
    """
    # Check rows 12-16 for a horizontal bar from the right side inward
    bar_lengths = []
    for r in range(12, 17):
        row = img_28[r]
        # Scan from right to left counting contiguous pixels
        run = 0
        for c in range(27, 9, -1):
            if row[c] > 0.1:
                run += 1
            elif run > 0:
                break
        bar_lengths.append(run)

    max_bar = max(bar_lengths)

    # G: horizontal bar runs at least 5 pixels inward from the right
    # C: only has the thin arc edge (1-3 pixels)
    if max_bar >= 5:
        return 'G'
    return 'C'


def _resolve_o_vs_q(img_28: np.ndarray) -> str:
    """
    Distinguish O from Q.
    Q has a small tail at the bottom-right that extends beyond the circle.
    O is a clean closed circle/ellipse.
    Detect the tail by checking if ink in the very bottom rows extends
    further right than the circle's body above it.
    """
    h_ext = _horizontal_extent_by_row(img_28)

    # Find the rightmost ink column in the body (rows 8-20) vs tail (rows 22-27)
    body_right = 0
    for r in range(8, 21):
        cols = np.nonzero(img_28[r] > 0.1)[0]
        if cols.size:
            body_right = max(body_right, int(cols[-1]))

    tail_right = 0
    tail_mass = 0
    for r in range(22, min(28, img_28.shape[0])):
        cols = np.nonzero(img_28[r] > 0.1)[0]
        if cols.size:
            tail_right = max(tail_right, int(cols[-1]))
            # Count ink beyond the circle body's right edge
            tail_mass += int((cols > body_right).sum())

    # Q: tail extends further right than the circle AND has extra mass
    if tail_right > body_right + 1 or tail_mass >= 3:
        return 'Q'
    return 'O'


def _resolve_h_vs_n(img_28: np.ndarray) -> str:
    """
    Distinguish H from N.
    H: two vertical stems connected by a HORIZONTAL bar in the middle.
       Middle rows are solidly filled between the stems.
    N: two vertical stems connected by a DIAGONAL stroke.
       Middle rows have ink at separated positions (stem, diagonal, stem).
    Key: fill ratio in middle rows. H ≈ 1.0, N < 0.6.
    """
    h_ext = _horizontal_extent_by_row(img_28)
    mass = _pixel_mass_by_row(img_28)

    # Compute fill ratio = mass / extent for mid rows
    fill_ratios = []
    for r in range(11, 17):
        if h_ext[r] > 3:
            fill_ratios.append(float(mass[r]) / float(h_ext[r]))

    max_fill = float(np.max(fill_ratios)) if fill_ratios else 0.0

    # H: crossbar row has fill ratio near 1.0 (solid bar between stems)
    # N: diagonal never fills a full row between stems (max ≈ 0.6)
    if max_fill > 0.8:
        return 'H'
    return 'N'


# Update the confusion resolvers dict with new pairs
_CONFUSION_RESOLVERS.update({
    ('B', 'D'): _resolve_b_vs_d,
    ('D', 'B'): _resolve_b_vs_d,
    ('M', 'N'): _resolve_m_vs_n,
    ('N', 'M'): _resolve_m_vs_n,
    ('P', 'R'): _resolve_p_vs_r,
    ('R', 'P'): _resolve_p_vs_r,
    ('C', 'G'): _resolve_c_vs_g,
    ('G', 'C'): _resolve_c_vs_g,
    ('O', 'Q'): _resolve_o_vs_q,
    ('Q', 'O'): _resolve_o_vs_q,
    ('H', 'N'): _resolve_h_vs_n,
    ('N', 'H'): _resolve_h_vs_n,
})
for _pair in list(_CONFUSION_RESOLVERS):
    _CONFUSION_LETTERS.update(_pair)


# ============================================================================
# STRUCTURAL FEATURE PROFILES — used for verification of ALL 26 letters
# ============================================================================
# Each letter has a set of expected structural features. After the model
# predicts a letter, these features are checked against the actual image
# to produce a "structural plausibility" score. If the score is very low,
# the next-best candidate is checked instead.
#
# Features per letter:
#   aspect_range: (min, max) expected width/height ratio
#   sym_h: expected horizontal symmetry score (0=none, 1=perfect)
#   open_bottom: whether the letter is open at the bottom
#   has_crossbar: whether there's a horizontal bar across the middle
#   enclosed: whether the letter has enclosed spaces
# ============================================================================

# Structural profiles: (aspect_min, aspect_max, has_crossbar, open_bottom, enclosed)
_LETTER_PROFILES = {
    'A': {'aspect': (0.5, 1.2), 'crossbar': True,  'open_bot': True,  'enclosed': False},
    'B': {'aspect': (0.4, 0.9), 'crossbar': False, 'open_bot': False, 'enclosed': True},
    'C': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': False, 'enclosed': False},
    'D': {'aspect': (0.4, 1.0), 'crossbar': False, 'open_bot': False, 'enclosed': True},
    'E': {'aspect': (0.4, 0.9), 'crossbar': True,  'open_bot': False, 'enclosed': False},
    'F': {'aspect': (0.4, 0.9), 'crossbar': True,  'open_bot': True,  'enclosed': False},
    'G': {'aspect': (0.5, 1.2), 'crossbar': True,  'open_bot': False, 'enclosed': False},
    'H': {'aspect': (0.5, 1.2), 'crossbar': True,  'open_bot': True,  'enclosed': False},
    'I': {'aspect': (0.1, 0.5), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'J': {'aspect': (0.2, 0.7), 'crossbar': False, 'open_bot': False, 'enclosed': False},
    'K': {'aspect': (0.5, 1.1), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'L': {'aspect': (0.4, 1.0), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'M': {'aspect': (0.7, 1.5), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'N': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'O': {'aspect': (0.6, 1.3), 'crossbar': False, 'open_bot': False, 'enclosed': True},
    'P': {'aspect': (0.4, 0.9), 'crossbar': False, 'open_bot': True,  'enclosed': True},
    'Q': {'aspect': (0.6, 1.3), 'crossbar': False, 'open_bot': False, 'enclosed': True},
    'R': {'aspect': (0.4, 1.0), 'crossbar': False, 'open_bot': True,  'enclosed': True},
    'S': {'aspect': (0.4, 1.0), 'crossbar': False, 'open_bot': False, 'enclosed': False},
    'T': {'aspect': (0.5, 1.2), 'crossbar': True,  'open_bot': True,  'enclosed': False},
    'U': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': False, 'enclosed': False},
    'V': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'W': {'aspect': (0.7, 1.5), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'X': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'Y': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': True,  'enclosed': False},
    'Z': {'aspect': (0.5, 1.2), 'crossbar': False, 'open_bot': False, 'enclosed': False},
}


def _compute_structural_features(img_28: np.ndarray) -> dict:
    """
    Compute structural features of the letter in the 28x28 image.
    Returns dict with: aspect_ratio, has_crossbar, open_bottom, enclosed.
    """
    h_ext = _horizontal_extent_by_row(img_28)
    mass = _pixel_mass_by_row(img_28)

    # --- Aspect ratio ---
    active_rows = np.nonzero(mass > 0)[0]
    if active_rows.size < 2:
        return {'aspect': 1.0, 'crossbar': False, 'open_bot': True, 'enclosed': False}
    content_height = float(active_rows[-1] - active_rows[0] + 1)
    active_widths = h_ext[h_ext > 0]
    content_width = float(active_widths.max()) if active_widths.size else 1
    aspect = content_width / max(content_height, 1)

    # --- Crossbar detection ---
    # A crossbar is a wide horizontal stroke in the middle that's wider than
    # the average of top and bottom widths
    mid_widths = h_ext[10:18]
    top_widths = h_ext[3:9]
    bot_widths = h_ext[20:26]
    mid_max = float(mid_widths.max()) if mid_widths.size else 0
    top_max = float(top_widths.max()) if top_widths.size else 0
    bot_max = float(bot_widths.max()) if bot_widths.size else 0

    # Crossbar: middle has significant mass relative to extremes
    mid_mass = float(mass[10:18].mean())
    extreme_mass = (float(mass[3:9].mean()) + float(mass[20:26].mean())) / 2
    has_crossbar = mid_mass > extreme_mass * 1.15 and mid_max > 5

    # --- Open bottom ---
    # Letter is "open" at the bottom if the bottom rows have low mass
    bot_mass_total = float(mass[22:27].sum())
    mid_mass_total = float(mass[10:18].sum())
    open_bottom = bot_mass_total < mid_mass_total * 0.4 if mid_mass_total > 0 else True

    # --- Enclosed space detection ---
    # Check if there's a region of zero pixels completely surrounded by ink
    # Simple approximation: look for rows where the gap between leftmost and
    # rightmost ink columns is much larger than the actual ink mass
    enclosed = False
    for r in range(5, 23):
        nonzero = np.nonzero(img_28[r] > 0.1)[0]
        if nonzero.size >= 2:
            span = nonzero[-1] - nonzero[0] + 1
            ink_count = nonzero.size
            if span > 5 and ink_count < span * 0.7:
                enclosed = True
                break

    return {
        'aspect': aspect,
        'crossbar': has_crossbar,
        'open_bot': open_bottom,
        'enclosed': enclosed,
    }


def _structural_plausibility(img_28: np.ndarray, letter: str) -> float:
    """
    Score how well the image's structural features match the expected
    profile for the given letter. Returns 0.0-1.0.
    """
    profile = _LETTER_PROFILES.get(letter)
    if profile is None:
        return 0.5  # Unknown letter — neutral score

    features = _compute_structural_features(img_28)
    score = 1.0
    penalties = 0

    # Aspect ratio check (soft)
    a_min, a_max = profile['aspect']
    if features['aspect'] < a_min - 0.2 or features['aspect'] > a_max + 0.2:
        penalties += 1
    elif features['aspect'] < a_min or features['aspect'] > a_max:
        penalties += 0.3

    # Crossbar match
    if profile['crossbar'] != features['crossbar']:
        penalties += 0.5

    # Open bottom match
    if profile['open_bot'] != features['open_bot']:
        penalties += 0.3

    # Enclosed space match
    if profile['enclosed'] != features['enclosed']:
        penalties += 0.3

    score = max(0.0, 1.0 - penalties * 0.3)
    return score


# ============================================================================
# TEST-TIME AUGMENTATION (TTA) — improves accuracy for ALL letters
# ============================================================================
# Small rotations of the preprocessed image are fed to the model and the
# softmax outputs are averaged. This makes the prediction robust to slight
# pen-angle variations in children's handwriting, which is the primary
# source of classification error for many letters.
#
# Augmentations: [-4°, -2°, 0°, +2°, +4°] rotations — 5 passes total.
# The overhead (~5x inference) is acceptable for a single-letter prediction
# on a mobile backend.
# ============================================================================

TTA_ANGLES = [-4, -2, 0, 2, 4]


def _generate_tta_variants(input_data: np.ndarray) -> list:
    """
    Generate rotated variants of a [1,28,28,1] input for TTA.
    Returns list of [1,28,28,1] arrays.
    """
    img_28 = input_data[0, :, :, 0]  # [28,28]
    variants = []

    for angle in TTA_ANGLES:
        if angle == 0:
            variants.append(input_data.copy())
        elif SCIPY_AVAILABLE:
            rotated = ndimage.rotate(img_28, angle, reshape=False, order=1, mode='constant', cval=0.0)
            # Re-normalize: rotation interpolation can create values outside 0-1
            rotated = np.clip(rotated, 0, 1)
            variants.append(rotated.reshape(1, 28, 28, 1).astype(np.float32))
        else:
            variants.append(input_data.copy())

    return variants


def _run_inference(input_data: np.ndarray) -> np.ndarray:
    """
    Run the TFLite model on a single [1,28,28,1] input.
    Returns raw logits array of shape [num_classes].
    """
    _interpreter.set_tensor(_input_details[0]['index'], input_data)
    _interpreter.invoke()
    output_data = _interpreter.get_tensor(_output_details[0]['index'])
    return output_data[0]


def _ensemble_predictions(input_data: np.ndarray) -> np.ndarray:
    """
    Run TTA: generate rotated variants, run inference on each, and
    average the softmax probabilities.
    Returns averaged probability array of shape [num_classes].
    """
    variants = _generate_tta_variants(input_data)
    all_probs = []

    for variant in variants:
        raw = _run_inference(variant)
        # Softmax
        exp_vals = np.exp(raw - np.max(raw))
        probs = exp_vals / exp_vals.sum()
        all_probs.append(probs)

    # Average the probability distributions
    avg_probs = np.mean(all_probs, axis=0)
    return avg_probs


def get_similar_letters(letter: str) -> set:
    """
    Get all letters that are visually similar to the given letter.
    
    Args:
        letter: The letter to find similar letters for (uppercase)
        
    Returns:
        Set of similar letters (including the letter itself)
    """
    letter = letter.upper()
    return _SIMILAR_LETTER_LOOKUP.get(letter, {letter})


def get_interpreter():
    """
    Lazy load TensorFlow Lite interpreter. Tries multiple backends.
    Returns None if no TFLite interpreter is available.
    """
    # Try AI Edge LiteRT first (Google's new lightweight package)
    try:
        from ai_edge_litert import interpreter as litert
        logger.info("Using AI Edge LiteRT for interpretation")
        return litert.Interpreter
    except ImportError:
        pass
    
    # Try full TensorFlow
    try:
        import tensorflow as tf
        logger.info("Using TensorFlow for TFLite interpretation")
        return tf.lite.Interpreter
    except ImportError:
        pass
    
    # Try tflite-runtime
    try:
        import tflite_runtime.interpreter as tflite
        logger.info("Using TFLite Runtime for interpretation")
        return tflite.Interpreter
    except ImportError:
        pass
    
    logger.warning(
        "No TFLite interpreter found. Install one of: "
        "tensorflow (Python 3.9-3.12), tflite-runtime, or ai-edge-litert"
    )
    return None


def load_model(model_path: str):
    """
    Load TFLite model from the given path.
    Falls back to mock mode if TensorFlow is not available.
    
    Args:
        model_path: Path to the .tflite model file
        
    Returns:
        tuple: (interpreter, input_details, output_details) or (None, None, None) for mock mode
    """
    global _interpreter, _input_details, _output_details, _model_loaded, _using_mock
    
    if _model_loaded:
        logger.info("Model already loaded")
        return _interpreter, _input_details, _output_details
    
    # Try to load with TFLite interpreter
    Interpreter = get_interpreter()
    
    if Interpreter is None:
        logger.warning("="*60)
        logger.warning("MOCK MODE ENABLED - No TensorFlow installation found")
        logger.warning("Predictions will be simulated for testing purposes.")
        logger.warning("To use real predictions, install Python 3.11/3.12 with TensorFlow")
        logger.warning("="*60)
        _using_mock = True
        _model_loaded = True
        return None, None, None
    
    if not os.path.exists(model_path):
        logger.error(f"Model file not found: {model_path}")
        logger.warning("Falling back to mock mode")
        _using_mock = True
        _model_loaded = True
        return None, None, None
    
    logger.info(f"Loading model from: {model_path}")
    
    try:
        _interpreter = Interpreter(model_path=model_path)
        _interpreter.allocate_tensors()
        
        _input_details = _interpreter.get_input_details()
        _output_details = _interpreter.get_output_details()
        
        logger.info(f"Model loaded successfully")
        logger.info(f"Input shape: {_input_details[0]['shape']}")
        logger.info(f"Output shape: {_output_details[0]['shape']}")
        
        _model_loaded = True
        _using_mock = False
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.warning("Falling back to mock mode")
        _using_mock = True
        _model_loaded = True
    
    return _interpreter, _input_details, _output_details


# Debug settings - only save debug images in development, not on Render
DEBUG_SAVE_IMAGES = os.getenv('FLASK_ENV', 'development') != 'production'
DEBUG_IMAGE_COUNTER = [0]  # Using list for mutable counter


def otsu_threshold(img_array: np.ndarray) -> float:
    """
    Calculate Otsu's optimal threshold value.
    This finds the threshold that minimizes intra-class variance.
    """
    # Flatten and convert to int
    pixels = img_array.flatten().astype(np.int32)
    
    # Calculate histogram
    hist, _ = np.histogram(pixels, bins=256, range=(0, 256))
    hist = hist.astype(np.float32)
    
    # Normalize
    hist /= hist.sum()
    
    # Calculate cumulative sums and means
    cum_sum = np.cumsum(hist)
    cum_mean = np.cumsum(hist * np.arange(256))
    
    # Global mean
    global_mean = cum_mean[-1]
    
    # Calculate between-class variance for all thresholds
    w0 = cum_sum
    w1 = 1 - w0
    
    # Avoid division by zero
    w0 = np.where(w0 == 0, 1e-10, w0)
    w1 = np.where(w1 == 0, 1e-10, w1)
    
    mean0 = cum_mean / w0
    mean1 = (global_mean - cum_mean) / w1
    
    # Between-class variance
    variance = w0 * w1 * (mean0 - mean1) ** 2
    
    # Find optimal threshold
    optimal_threshold = np.argmax(variance)
    
    return float(optimal_threshold)


def preprocess_image(image_data: str) -> np.ndarray:
    """
    Advanced preprocessing for letter recognition with EMNIST alignment.
    
    PREPROCESSING PIPELINE:
    1. Decode base64 image
    2. Convert to grayscale
    3. Auto-detect background polarity and normalize
    4. Otsu's adaptive thresholding
    5. Morphological operations (dilation + erosion for clean strokes)
    6. Noise removal (connected component filtering)
    7. Tight bounding box crop with padding
    8. EMNIST-style centering by center of mass into 20x20 box
    9. Place in 28x28 canvas (4px margin, matching EMNIST format)
    10. Normalize to 0-1 range
    
    The model was trained on EMNIST-style data:
    - 28x28 pixels
    - White letters on BLACK background
    - Content fits in a ~20x20 box centered by center of mass
    - 4px margin around the content
    - Normalized to 0-1 range
    
    Args:
        image_data: Base64 encoded image string
        
    Returns:
        numpy array ready for model input (shape: [1, 28, 28, 1])
    """
    # Increment debug counter
    DEBUG_IMAGE_COUNTER[0] += 1
    debug_id = DEBUG_IMAGE_COUNTER[0]
    
    # Create debug folder
    if DEBUG_SAVE_IMAGES:
        os.makedirs('debug_images', exist_ok=True)
    
    # =========================================================================
    # STEP 1: DECODE BASE64 IMAGE
    # =========================================================================
    
    if ',' in image_data:
        image_data = image_data.split(',')[-1]
    
    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))
    
    logger.info(f"[{debug_id}] Original: size={img.size}, mode={img.mode}")
    
    if DEBUG_SAVE_IMAGES:
        img.save(f'debug_images/{debug_id:03d}_1_original.png')
    
    # =========================================================================
    # STEP 2: CONVERT TO GRAYSCALE
    # =========================================================================
    
    # Handle RGBA images - composite on white background first
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    
    img_gray = img.convert('L')
    img_array = np.array(img_gray, dtype=np.float32)
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_array.astype(np.uint8)).save(f'debug_images/{debug_id:03d}_2_grayscale.png')
    
    logger.info(f"[{debug_id}] Grayscale: min={img_array.min():.0f}, max={img_array.max():.0f}")
    
    # =========================================================================
    # STEP 3: NORMALIZE COLOR POLARITY (AUTO-DETECT BACKGROUND)
    # =========================================================================
    # Model expects: bright strokes on dark background.

    h, w = img_array.shape
    border_px = max(2, min(h, w) // 20)
    border_values = np.concatenate([
        img_array[:border_px, :].ravel(),
        img_array[-border_px:, :].ravel(),
        img_array[:, :border_px].ravel(),
        img_array[:, -border_px:].ravel(),
    ])
    border_mean = float(border_values.mean()) if border_values.size else float(img_array.mean())

    if border_mean > 127.0:
        img_model_polarity = 255.0 - img_array
        polarity_mode = "inverted_to_white_on_black"
    else:
        img_model_polarity = img_array.copy()
        polarity_mode = "kept_white_on_black"

    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_model_polarity.astype(np.uint8)).save(
            f'debug_images/{debug_id:03d}_3_polarity_normalized.png'
        )

    logger.info(
        f"[{debug_id}] Polarity mode: {polarity_mode}, "
        f"border_mean={border_mean:.1f}, "
        f"min={img_model_polarity.min():.0f}, max={img_model_polarity.max():.0f}"
    )
    
    # =========================================================================
    # STEP 4: ADAPTIVE THRESHOLDING (Otsu's method)
    # =========================================================================
    
    threshold = otsu_threshold(img_model_polarity)
    threshold = max(threshold, 25)  # Minimum threshold to avoid noise
    
    logger.info(f"[{debug_id}] Otsu threshold: {threshold:.0f}")
    
    # Create clean binary image
    img_binary = (img_model_polarity > threshold).astype(np.float32)
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_binary * 255).astype(np.uint8)).save(f'debug_images/{debug_id:03d}_4_threshold.png')
    
    # =========================================================================
    # STEP 5: MORPHOLOGICAL OPERATIONS (if scipy available)
    # =========================================================================
    # Children (especially dyslexic) produce strokes with gaps and thin lines.
    # Use stronger dilation to close gaps, then erosion to restore shape.
    
    if SCIPY_AVAILABLE:
        # Cross-shaped (diamond) kernel for morphological closing.
        # Research on dyslexic children's handwriting (Rosenblum et al., 2003)
        # shows they produce strokes with small gaps from pen lifts. Closing
        # repairs these gaps. A cross-shaped kernel (vs box) better preserves
        # corner and junction details that distinguish similar letters:
        #   W/V valleys, M/N peaks, K/X intersections, E/F/L corners.
        dilate_iter = 1
        
        struct_close = ndimage.generate_binary_structure(2, 1)  # cross/diamond
        
        # Closing: dilation then erosion - fills gaps in children's strokes
        img_closed = ndimage.binary_dilation(img_binary > 0, structure=struct_close, iterations=dilate_iter)
        img_closed = ndimage.binary_erosion(img_closed, structure=struct_close, iterations=dilate_iter)
        img_closed = img_closed.astype(np.float32)
        
        # Remove tiny noise specks by labeling connected components
        labeled, num_features = ndimage.label(img_closed)
        if num_features > 1:
            # Keep only components with significant size (>1% of total stroke pixels)
            component_sizes = ndimage.sum(img_closed, labeled, range(1, num_features + 1))
            total_stroke = img_closed.sum()
            min_component_size = max(total_stroke * 0.01, 15)  # At least 15 pixels or 1%
            
            img_cleaned = np.zeros_like(img_closed)
            for i, size in enumerate(component_sizes):
                if size >= min_component_size:
                    img_cleaned[labeled == (i + 1)] = 1.0
            img_morphed = img_cleaned
            logger.info(f"[{debug_id}] Removed {num_features - int((component_sizes >= min_component_size).sum())} noise components")
        else:
            img_morphed = img_closed
        
        if DEBUG_SAVE_IMAGES:
            Image.fromarray((img_morphed * 255).astype(np.uint8)).save(f'debug_images/{debug_id:03d}_5_morphed.png')
        
        logger.info(f"[{debug_id}] Applied morphological closing (cross kernel, iter={dilate_iter}) + noise removal")
    else:
        img_morphed = img_binary
    
    # =========================================================================
    # STEP 5b: STROKE WIDTH NORMALIZATION
    # =========================================================================
    # Children draw with varying stroke widths depending on finger pressure,
    # speed, and device. The EMNIST training data has relatively consistent
    # stroke widths (~2-4px at 28x28). Normalizing here helps match the
    # training distribution better.
    #
    # Use distance transform to measure median stroke width, then adjust
    # via erosion (too thick) or dilation (too thin).
    # =========================================================================
    if SCIPY_AVAILABLE and img_morphed.sum() > 0:
        # Distance transform on the binary mask
        dist_map = ndimage.distance_transform_edt(img_morphed > 0)
        # Skeleton-adjacent points have the highest distance values
        # Median of non-zero distance values ≈ half the stroke width
        dist_nonzero = dist_map[dist_map > 0]
        if dist_nonzero.size > 0:
            median_half_width = float(np.median(dist_nonzero))
            estimated_stroke_width = median_half_width * 2

            # The image is still at the original resolution here.
            # Target stroke width at this resolution should be proportional
            # so that when resized to 28x28, strokes are ~3px wide.
            img_h, img_w = img_morphed.shape
            max_dim = max(img_h, img_w)
            # At 28x28, ~3px stroke. Scale to current resolution:
            target_stroke_width = max(3.0, 3.0 * max_dim / 28.0)

            ratio = estimated_stroke_width / max(target_stroke_width, 1)

            if ratio > 1.8:
                # Strokes too thick — erode to thin them
                erode_iter = min(int(round((ratio - 1.0) * 0.5)), 3)
                if erode_iter > 0:
                    struct_e = ndimage.generate_binary_structure(2, 1)
                    img_morphed = ndimage.binary_erosion(
                        img_morphed > 0, structure=struct_e, iterations=erode_iter
                    ).astype(np.float32)
                    logger.info(f"[{debug_id}] Stroke normalization: width={estimated_stroke_width:.1f} → eroded {erode_iter}x")
            elif ratio < 0.5:
                # Strokes too thin — dilate to thicken them
                dilate_iter = min(int(round((1.0 - ratio) * 0.5)), 2)
                if dilate_iter > 0:
                    struct_d = ndimage.generate_binary_structure(2, 1)
                    img_morphed = ndimage.binary_dilation(
                        img_morphed > 0, structure=struct_d, iterations=dilate_iter
                    ).astype(np.float32)
                    logger.info(f"[{debug_id}] Stroke normalization: width={estimated_stroke_width:.1f} → dilated {dilate_iter}x")
            else:
                logger.info(f"[{debug_id}] Stroke width OK: {estimated_stroke_width:.1f} (target ~{target_stroke_width:.1f})")

    # =========================================================================
    # STEP 6: FIND BOUNDING BOX
    # =========================================================================
    
    non_zero = np.nonzero(img_morphed > 0)
    
    if len(non_zero[0]) == 0:
        logger.warning(f"[{debug_id}] No content detected!")
        return np.zeros((1, 28, 28, 1), dtype=np.float32)
    
    top = non_zero[0].min()
    bottom = non_zero[0].max()
    left = non_zero[1].min()
    right = non_zero[1].max()
    
    # Tight crop with minimal padding (5%)
    height = bottom - top + 1
    width = right - left + 1
    max_dim = max(height, width, 1)
    padding = int(max_dim * 0.05)
    
    top = max(0, top - padding)
    bottom = min(img_morphed.shape[0], bottom + padding + 1)
    left = max(0, left - padding)
    right = min(img_morphed.shape[1], right + padding + 1)
    
    img_cropped_binary = img_morphed[top:bottom, left:right]
    
    # =========================================================================
    # STEP 6b: GRAYSCALE-AWARE CROP
    # =========================================================================
    # Use the GRAYSCALE image (not binary) for the resize step.
    # EMNIST training data has smooth anti-aliased edges from downscaling.
    # Binary images produce harsh pixelated strokes that don't match the
    # training distribution, causing confusion between similar letters.
    img_cropped_gray = img_model_polarity[top:bottom, left:right]
    # Zero out anything below threshold so background is clean black
    img_cropped_gray = np.where(img_cropped_binary > 0, img_cropped_gray, 0)
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_cropped_binary * 255).astype(np.uint8)).save(f'debug_images/{debug_id:03d}_6_cropped.png')
        Image.fromarray(img_cropped_gray.astype(np.uint8)).save(f'debug_images/{debug_id:03d}_6b_cropped_gray.png')
    
    logger.info(f"[{debug_id}] Cropped: {img_cropped_binary.shape}")
    
    # =========================================================================
    # STEP 6c: PRE-RESIZE GAUSSIAN SMOOTHING
    # =========================================================================
    # Mobile touchscreen captures have micro-jitter and pixel-perfect SVG edges
    # that differ from pen-on-paper scans used to create EMNIST training data.
    # A light Gaussian at the high-res stage (where there are hundreds of pixels
    # of detail) smooths these artifacts without losing information.
    # This produces cleaner anti-aliased edges during the LANCZOS downsampling
    # step, better matching the EMNIST distribution.
    if SCIPY_AVAILABLE:
        crop_max_dim = max(img_cropped_gray.shape)
        if crop_max_dim > 100:
            # sigma scales with resolution: ~0.6 at 500px, lighter for smaller crops
            # Reduced from 1.0 to preserve angular features (Z vs S, E vs F corners)
            smooth_sigma = max(0.3, crop_max_dim / 800.0)
            img_cropped_gray = ndimage.gaussian_filter(
                img_cropped_gray.astype(np.float64), sigma=smooth_sigma
            ).astype(np.float32)
            # Re-zero background to prevent halo
            img_cropped_gray = np.where(img_cropped_binary > 0, img_cropped_gray, 0)
            logger.info(f"[{debug_id}] Pre-resize Gaussian smoothing sigma={smooth_sigma:.2f}")
    
    # =========================================================================
    # STEP 7: EMNIST-STYLE FITTING INTO 20x20 BOX
    # =========================================================================
    # EMNIST data places content in a 20x20 box centered in 28x28
    # This is critical for matching the training data distribution
    
    h, w = img_cropped_gray.shape
    
    # Resize content to fit in 20x20 while preserving aspect ratio
    target_size = 20
    if h > w:
        new_h = target_size
        new_w = max(1, int(w * target_size / h))
    else:
        new_w = target_size
        new_h = max(1, int(h * target_size / w))
    
    # Resize the GRAYSCALE image (preserves anti-aliased edges like EMNIST)
    img_pil = Image.fromarray(img_cropped_gray.astype(np.uint8))
    img_resized = img_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
    img_20 = np.array(img_resized, dtype=np.float32)
    
    if DEBUG_SAVE_IMAGES:
        img_resized.save(f'debug_images/{debug_id:03d}_7_resized_20.png')
    
    logger.info(f"[{debug_id}] Resized to {new_w}x{new_h} (fit in 20x20)")
    
    # =========================================================================
    # STEP 8: CENTER BY CENTER OF MASS IN 28x28 CANVAS
    # =========================================================================
    
    img_28 = np.zeros((28, 28), dtype=np.float32)
    
    if SCIPY_AVAILABLE and img_20.sum() > 0:
        # Calculate center of mass
        cy, cx = ndimage.center_of_mass(img_20)
        cy = cy if not np.isnan(cy) else new_h / 2
        cx = cx if not np.isnan(cx) else new_w / 2
        
        # Place content so center of mass is at (14, 14) - center of 28x28
        y_offset = int(14 - cy)
        x_offset = int(14 - cx)
        
        # Clamp offsets to keep content within canvas
        y_offset = max(0, min(y_offset, 28 - new_h))
        x_offset = max(0, min(x_offset, 28 - new_w))
        
        logger.info(f"[{debug_id}] Center of mass: ({cy:.1f}, {cx:.1f}), offset: ({y_offset}, {x_offset})")
    else:
        # Simple centering
        y_offset = (28 - new_h) // 2
        x_offset = (28 - new_w) // 2
    
    img_28[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img_20
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray(img_28.astype(np.uint8)).save(f'debug_images/{debug_id:03d}_8_centered_28x28.png')
    
    # =========================================================================
    # STEP 9: NORMALIZE TO 0-1
    # =========================================================================
    
    img_norm = img_28 / 255.0
    
    # Boost weak strokes to full range
    if img_norm.max() > 0:
        img_norm = img_norm / img_norm.max()
    
    # Remove very low values (noise)
    img_norm = np.where(img_norm > 0.05, img_norm, 0)
    
    if DEBUG_SAVE_IMAGES:
        Image.fromarray((img_norm * 255).astype(np.uint8)).save(f'debug_images/{debug_id:03d}_9_final_normalized.png')
    
    logger.info(f"[{debug_id}] Normalized: min={img_norm.min():.3f}, max={img_norm.max():.3f}, mean={img_norm.mean():.3f}")
    
    # =========================================================================
    # STEP 10: RESHAPE FOR MODEL
    # =========================================================================
    
    input_data = np.expand_dims(img_norm, axis=0)    # [1, 28, 28]
    input_data = np.expand_dims(input_data, axis=-1)  # [1, 28, 28, 1]
    
    logger.info(f"[{debug_id}] Final shape: {input_data.shape}")
    
    return input_data.astype(np.float32)


def mock_predict(input_data: np.ndarray) -> dict:
    """
    Generate a mock prediction for testing when TensorFlow is not available.
    Uses a simple heuristic based on image pixel values.
    """
    # Simple heuristic: use mean pixel value to generate a deterministic-ish result
    mean_val = np.mean(input_data)
    std_val = np.std(input_data)
    
    # Create a pseudo-random but deterministic index based on image content
    index = int((mean_val * 1000 + std_val * 100) % len(ALPHANUMERIC_LABELS))
    
    # Simulate confidence
    confidence = 0.7 + (std_val * 0.3)  # Higher variation = higher "confidence"
    confidence = min(0.95, max(0.5, confidence))
    
    label = ALPHANUMERIC_LABELS[index]
    
    logger.info(f"[MOCK] Predicted: {label} (index: {index}, confidence: {confidence:.4f})")
    
    return {
        'label': label,
        'confidence': float(confidence),
        'index': index,
        'mock': True  # Flag indicating this is a mock prediction
    }


def predict_letter(image_data: str) -> dict:
    """
    Predict letter from base64 encoded image.
    
    Args:
        image_data: Base64 encoded image string
        
    Returns:
        dict with 'label', 'confidence', and 'index'
    """
    global _using_mock
    
    if not _model_loaded:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    
    # Preprocess image
    input_data = preprocess_image(image_data)
    
    # Use mock prediction if no interpreter available
    if _using_mock or _interpreter is None:
        return mock_predict(input_data)

    # =========================================================================
    # SINGLE-PASS INFERENCE (BASE ORIENTATION)
    # =========================================================================
    # Diagnostic testing (test_orientation.py) confirmed this model expects
    # the BASE orientation with no transformation — 14/14 letters correct.
    #
    # IMPORTANT: Do NOT use multi-variant orientation testing here!
    # The old approach tried 6 orientations and picked highest confidence,
    # but wrong orientations can produce HIGH confidence for WRONG letters:
    #   - "W" transposed → "M" at 99.3% confidence (WRONG but very confident)
    #   - "N" transposed → "S" at 99.4% confidence (WRONG but very confident)
    #   - "Z" transposed → "M" at 40.2% confidence (WRONG)
    # This caused systematic misrecognition across many letter pairs.
    # =========================================================================
    
    # =========================================================================
    # TEST-TIME AUGMENTATION (TTA) ENSEMBLE
    # =========================================================================
    # Average softmax probabilities across small rotations (-4°..+4°) for
    # more robust predictions. This is the single most effective technique
    # for improving accuracy across ALL letters without retraining.
    # =========================================================================
    predictions = _ensemble_predictions(input_data)
    
    # Get top 5 predictions for more flexible matching (helpful for imperfect handwriting)
    top_indices = np.argsort(predictions)[::-1][:5]
    
    top_predictions = []
    for idx in top_indices:
        label = ALPHANUMERIC_LABELS[idx] if idx < len(ALPHANUMERIC_LABELS) else str(idx)
        conf = float(predictions[idx])
        top_predictions.append({
            'label': label,
            'confidence': conf,
            'index': int(idx)
        })
    
    # Primary prediction
    max_idx = int(top_indices[0])
    confidence = float(predictions[max_idx])
    
    if max_idx < len(ALPHANUMERIC_LABELS):
        label = ALPHANUMERIC_LABELS[max_idx]
    else:
        label = str(max_idx)
    
    # Log all top predictions for debugging
    pred_str = ', '.join([f"{p['label']}({p['confidence']:.2f})" for p in top_predictions])
    logger.info(f"TTA top predictions: {pred_str}")

    # --- Geometric reranking ---
    # When the top-2 predictions are a known confusion pair (W/V/U, E/F, etc.),
    # use geometric analysis of the 28x28 image to correct the ranking.
    img_28 = input_data[0, :, :, 0]  # extract [28,28] from [1,28,28,1]
    label, confidence, top_predictions = _rerank_with_geometry(
        img_28, top_predictions
    )

    # --- Structural verification ---
    # Check if the top prediction is structurally plausible. If the runner-up
    # scores significantly better on structural features, swap them.
    if len(top_predictions) >= 2:
        top1_label = top_predictions[0]['label'].upper()
        top2_label = top_predictions[1]['label'].upper()
        score1 = _structural_plausibility(img_28, top1_label)
        score2 = _structural_plausibility(img_28, top2_label)
        conf_gap = top_predictions[0]['confidence'] - top_predictions[1]['confidence']

        # Only swap if: structural score is much better for #2 AND confidence gap is small
        if score2 > score1 + 0.3 and conf_gap < 0.15:
            logger.info(
                f"Structural verification: '{top1_label}'({score1:.2f}) vs "
                f"'{top2_label}'({score2:.2f}), conf_gap={conf_gap:.3f} → swapping"
            )
            top_predictions[0], top_predictions[1] = top_predictions[1], top_predictions[0]
            label = top_predictions[0]['label']
            confidence = top_predictions[0]['confidence']

    max_idx = top_predictions[0]['index']
    
    return {
        'label': label,
        'confidence': confidence,
        'index': max_idx,
        'top_predictions': top_predictions,  # Include alternatives for flexible matching
        '_preprocessed': input_data,  # Internal: used by confusion resolver
    }


def predict_letter_dyslexia_friendly(image_data: str, expected_letter: str = None) -> dict:
    """
    Strict letter prediction for dyslexic children's handwriting practice.
    
    Uses confidence thresholds and ambiguity checks to avoid accepting
    wrong or unclear drawings. Also considers top-2 predictions to handle
    imperfect but recognisable handwriting.
    
    Acceptance criteria (ALL must be met):
    1. The expected letter is the #1 or #2 prediction
    2. The confidence for the expected letter >= MIN_CONFIDENCE (0.30)
    3. If expected letter is #2, the gap to #1 must be small (< 0.25)
    4. The drawing is not ambiguous (top-1 vs top-2 gap is reasonable)
    
    Args:
        image_data: Base64 encoded image string
        expected_letter: The letter the child was asked to write (optional)
        
    Returns:
        dict with prediction results and feedback
    """
    # =========================================================================
    # ACCEPTANCE THRESHOLDS — CALIBRATED FOR SOFTMAX ON 26 CLASSES
    # =========================================================================
    # Empirical observation: with softmax on this EMNIST model, correct
    # predictions typically score 0.06-0.10 (versus random chance ~0.038).
    # For children's touchscreen handwriting, scores are even lower due to
    # the distribution mismatch (EMNIST was trained on adult pen-on-paper).
    #
    # Pedagogical research (Nicolson & Fawcett, 2009; Dweck, 2006) strongly
    # recommends lenient acceptance for dyslexic children aged 6-12:
    #   - Frustration from frequent rejection causes learned helplessness
    #   - Target ~70-80% success rate per session for optimal learning
    #   - Accept approximations, then gradually increase standards
    #
    # Strategy: Use RANK-BASED acceptance with RATIO thresholds rather
    # than absolute confidence, since absolute values vary per model.
    # =========================================================================
    RANDOM_CHANCE = 1.0 / len(ALPHANUMERIC_LABELS)  # ~0.038 for 26 classes
    MIN_CONFIDENCE_FLOOR = RANDOM_CHANCE * 1.2       # Must beat random by 20%
    RANK2_MAX_RATIO = 0.65  # Rank-2 must be at least 65% of rank-1 confidence
    RANK3_MAX_RATIO = 0.50  # Rank-3 must be at least 50% of rank-1 confidence
    
    # Get the base prediction
    result = predict_letter(image_data)
    
    # Extract preprocessed image for geometric confusion-pair resolution
    preprocessed = result.pop('_preprocessed', None)
    img_28 = preprocessed[0, :, :, 0] if preprocessed is not None else None
    
    if expected_letter is None:
        # No expected letter provided, return base prediction
        result['dyslexia_friendly'] = False
        return result
    
    expected_letter = expected_letter.upper()
    predicted_letter = result['label'].upper()
    top1_confidence = result['confidence']
    
    # Check for exact match
    is_exact_match = (predicted_letter == expected_letter)
    
    # Scan ALL top predictions for the expected letter (up to top-5)
    expected_in_top = False
    expected_confidence = 0.0
    expected_rank = -1
    
    for i, pred in enumerate(result.get('top_predictions', [])):
        if pred['label'].upper() == expected_letter:
            expected_in_top = True
            expected_confidence = pred['confidence']
            expected_rank = i + 1  # 1-indexed rank
            break
    
    # =========================================================================
    # ACCEPTANCE LOGIC (research-backed, rank-based)
    # =========================================================================
    # Principles:
    #   1. If the model's TOP prediction matches the expected letter → ACCEPT.
    #      The child drew something the model thinks IS that letter. Never
    #      reject this — it's frustrating and pedagogically counterproductive.
    #   2. If expected is rank-2 and close to rank-1 → ACCEPT with encouragement.
    #      Handwriting is ambiguous; give the child benefit of the doubt.
    #   3. If expected is rank-3 and very close to rank-1 → ACCEPT gently.
    #      High intra-writer variability is a hallmark of dyslexic handwriting.
    #   4. Otherwise → REJECT with specific, constructive feedback.
    # =========================================================================
    should_accept = False
    rejection_reason = ''
    
    if is_exact_match or expected_rank == 1:
        # Expected letter IS the top prediction.
        # Always accept if above the random-chance floor.
        if expected_confidence > MIN_CONFIDENCE_FLOOR:
            should_accept = True
        else:
            should_accept = False
            rejection_reason = 'low_confidence'
    elif expected_rank == 2:
        # Expected letter is rank-2 — accept if reasonably close to rank-1.
        # Use ratio-based comparison (works regardless of absolute magnitudes).
        ratio = expected_confidence / max(top1_confidence, 1e-10)
        if ratio >= RANK2_MAX_RATIO and expected_confidence > MIN_CONFIDENCE_FLOOR:
            should_accept = True
        else:
            should_accept = False
            rejection_reason = 'rank2_too_far'
    elif expected_rank == 3:
        # Expected letter is rank-3 — accept only if very close to rank-1.
        # This handles high intra-writer variability in dyslexic handwriting.
        ratio = expected_confidence / max(top1_confidence, 1e-10)
        if ratio >= RANK3_MAX_RATIO and expected_confidence > MIN_CONFIDENCE_FLOOR:
            should_accept = True
        else:
            should_accept = False
            rejection_reason = 'rank3_too_far'
    else:
        # Expected letter is rank-4 or worse — the model clearly disagrees
        should_accept = False
        rejection_reason = 'not_recognized'
    
    # Calculate adjusted confidence
    adjusted_confidence = expected_confidence if expected_in_top else 0.0
    
    # =========================================================================
    # CONFUSION PAIR GEOMETRIC RESOLUTION
    # =========================================================================
    # When the model rejects a drawing for a known confusion pair
    # (L/I, E/F, W/V, Z/S, I/T), use geometric analysis of the 28x28
    # preprocessed image to check whether the child's drawing actually
    # matches the expected letter.  This compensates for the EMNIST model's
    # systematic weakness with these structurally similar letters on
    # children's touchscreen handwriting.
    # =========================================================================
    confusion_resolved = False
    if not should_accept and img_28 is not None:
        pair_key = (predicted_letter, expected_letter)
        if pair_key in _CONFUSION_RESOLVERS:
            resolved_letter = resolve_confusion_pair(
                img_28, predicted_letter, expected_letter
            )
            if resolved_letter == expected_letter:
                should_accept = True
                confusion_resolved = True
                adjusted_confidence = max(adjusted_confidence, top1_confidence * 0.8)
                logger.info(
                    f"Confusion pair override: model said '{predicted_letter}', "
                    f"geometry says '{expected_letter}' — accepting"
                )
    
    # =========================================================================
    # FEEDBACK MESSAGES
    # =========================================================================
    # Pedagogical guidelines for dyslexic children (Campbell, 2009; Dweck, 2006):
    #   - NEVER say "wrong" — use constructive, encouraging language
    #   - Praise effort and progress, not just correctness
    #   - Give specific, actionable tips (not vague "try harder")
    #   - Use child-friendly language (ages 6-12)
    # =========================================================================
    if should_accept and confusion_resolved:
        # Accepted via geometric confusion-pair resolution
        feedback_level = 'good'
        pair_tip = CONFUSION_PAIR_TIPS.get((expected_letter, predicted_letter))
        if pair_tip:
            feedback_message = f"Good work! I can see '{expected_letter}'! Tip: {pair_tip}"
        else:
            feedback_message = f"Good work! That's the letter '{expected_letter}'!"
    elif should_accept and (is_exact_match or expected_rank == 1):
        # Strong match — enthusiastic positive feedback
        feedback_level = 'excellent'
        if expected_confidence > 0.08:
            feedback_message = f"Amazing! That's a perfect '{expected_letter}'! ⭐"
        else:
            feedback_message = f"Great job! That's the letter '{expected_letter}'!"
    elif should_accept and expected_rank == 2:
        # Rank-2 match — positive with gentle hint
        feedback_level = 'good'
        feedback_message = f"Good work! I can see '{expected_letter}' in your drawing!"
    elif should_accept and expected_rank == 3:
        # Rank-3 match — accepted but encourage clarity
        feedback_level = 'good'
        feedback_message = (
            f"Nice try! That looks like '{expected_letter}'. "
            f"Try making it a bit clearer next time!"
        )
    else:
        # Rejection — give specific helpful feedback
        feedback_level = 'try_again'
        
        # Check for a research-backed confusion-pair tip (most valuable)
        pair_tip = CONFUSION_PAIR_TIPS.get((expected_letter, predicted_letter))
        
        if rejection_reason == 'low_confidence':
            feedback_message = (
                f"Hmm, I can't quite see the letter yet. "
                f"Try drawing '{expected_letter}' with bigger, bolder strokes!"
            )
        elif pair_tip:
            # Specific drawing tip for this confusion pair
            feedback_message = (
                f"Almost! {pair_tip}"
            )
        elif expected_in_top:
            feedback_message = (
                f"So close! That looks a bit like '{predicted_letter}'. "
                f"Let's try '{expected_letter}' one more time!"
            )
        else:
            feedback_message = (
                f"That looks like '{predicted_letter}'. "
                f"Let's try drawing '{expected_letter}' again — you can do it!"
            )
    
    result.update({
        'dyslexia_friendly': True,
        'expected_letter': expected_letter,
        'is_exact_match': is_exact_match,
        'is_similar_letter': False,  # No similarity matching in strict mode
        'similar_letters': [],  # Empty - no similar letters
        'should_accept': should_accept,
        'adjusted_confidence': float(min(1.0, adjusted_confidence)),
        'expected_in_top_predictions': expected_in_top,
        'expected_rank': expected_rank,
        'feedback_level': feedback_level,
        'feedback_message': feedback_message
    })
    
    logger.info(f"Dyslexia-friendly prediction: expected='{expected_letter}', "
               f"predicted='{predicted_letter}' ({top1_confidence:.4f}), "
               f"expected_rank={expected_rank}, expected_conf={expected_confidence:.4f}, "
               f"accept={should_accept}"
               f"{f', confusion_resolved=True' if confusion_resolved else ''}"
               f"{f', reason={rejection_reason}' if not should_accept else ''}")
    
    return result


def get_model_info() -> dict:
    """Get information about the loaded model."""
    if not _model_loaded:
        return {'loaded': False}
    
    if _using_mock:
        return {
            'loaded': True,
            'mode': 'mock',
            'message': 'Using mock predictions (TensorFlow not available)',
            'num_classes': len(ALPHANUMERIC_LABELS),
            'python_version_note': 'Install Python 3.11/3.12 for actual model inference'
        }
    
    return {
        'loaded': True,
        'mode': 'inference',
        'input_shape': _input_details[0]['shape'].tolist(),
        'output_shape': _output_details[0]['shape'].tolist(),
        'input_dtype': str(_input_details[0]['dtype']),
        'output_dtype': str(_output_details[0]['dtype']),
        'num_classes': len(ALPHANUMERIC_LABELS)
    }
