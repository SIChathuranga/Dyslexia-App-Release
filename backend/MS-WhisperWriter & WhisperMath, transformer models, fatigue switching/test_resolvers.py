"""
Test geometric confusion-pair resolvers with synthetic 28x28 images.

Each test draws a simplified version of a letter on a 28x28 canvas and
verifies that the geometric resolver correctly identifies it.

Covers:
  Round 1-2 resolvers: W/V/U, E/F, L/I, Z/S, I/T
  Round 3 resolvers:   B/D, M/N, P/R, C/G, O/Q, H/N
  Structural verification: _structural_plausibility
"""

import numpy as np
import sys
sys.path.insert(0, '.')

from services.ml_service import (
    _resolve_w_v_u,
    _resolve_e_vs_f,
    _resolve_l_vs_i,
    _resolve_z_vs_s,
    _resolve_i_vs_t,
    _resolve_b_vs_d,
    _resolve_m_vs_n,
    _resolve_p_vs_r,
    _resolve_c_vs_g,
    _resolve_o_vs_q,
    _resolve_h_vs_n,
    _rerank_with_geometry,
    _structural_plausibility,
)


def make_blank():
    return np.zeros((28, 28), dtype=np.float32)


def draw_line(img, r0, c0, r1, c1, thickness=1):
    """Draw a line on the image (Bresenham-style, thickened)."""
    steps = max(abs(r1 - r0), abs(c1 - c0), 1)
    for i in range(steps + 1):
        t = i / steps
        r = int(round(r0 + (r1 - r0) * t))
        c = int(round(c0 + (c1 - c0) * t))
        for dr in range(-thickness // 2, thickness // 2 + 1):
            for dc in range(-thickness // 2, thickness // 2 + 1):
                rr, cc = r + dr, c + dc
                if 0 <= rr < 28 and 0 <= cc < 28:
                    img[rr, cc] = 1.0


def draw_arc(img, center_r, center_c, radius, start_deg, end_deg, thickness=1):
    """Draw an arc on the image."""
    for deg in range(start_deg, end_deg + 1):
        rad = np.radians(deg)
        r = int(round(center_r + radius * np.sin(rad)))
        c = int(round(center_c + radius * np.cos(rad)))
        for dr in range(-thickness // 2, thickness // 2 + 1):
            for dc in range(-thickness // 2, thickness // 2 + 1):
                rr, cc = r + dr, c + dc
                if 0 <= rr < 28 and 0 <= cc < 28:
                    img[rr, cc] = 1.0


# =========================================================================
# Synthetic letter drawings
# =========================================================================

def draw_V():
    """V: two diagonals meeting at a sharp point at the bottom."""
    img = make_blank()
    draw_line(img, 3, 5, 24, 14, thickness=2)   # left diagonal down to point
    draw_line(img, 3, 23, 24, 14, thickness=2)  # right diagonal down to point
    return img


def draw_W():
    """W: two V-shapes side by side — stays wide at bottom."""
    img = make_blank()
    # Left V
    draw_line(img, 3, 3, 22, 10, thickness=2)
    draw_line(img, 22, 10, 12, 14, thickness=2)
    # Right V
    draw_line(img, 12, 14, 22, 18, thickness=2)
    draw_line(img, 22, 18, 3, 25, thickness=2)
    return img


def draw_U():
    """U: two vertical sides connected by a curved bottom."""
    img = make_blank()
    # Left vertical
    draw_line(img, 3, 6, 18, 6, thickness=2)
    # Right vertical
    draw_line(img, 3, 22, 18, 22, thickness=2)
    # Bottom curve
    draw_arc(img, 18, 14, 8, 0, 180, thickness=2)
    return img


def draw_E():
    """E: vertical stem with three horizontal bars (top, middle, bottom)."""
    img = make_blank()
    # Vertical stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Top bar
    draw_line(img, 3, 6, 3, 22, thickness=2)
    # Middle bar
    draw_line(img, 14, 6, 14, 20, thickness=2)
    # Bottom bar
    draw_line(img, 25, 6, 25, 22, thickness=2)
    return img


def draw_F():
    """F: vertical stem with two horizontal bars (top, middle). No bottom bar."""
    img = make_blank()
    # Vertical stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Top bar
    draw_line(img, 3, 6, 3, 22, thickness=2)
    # Middle bar
    draw_line(img, 14, 6, 14, 20, thickness=2)
    return img


def draw_L():
    """L: vertical stem with horizontal foot at bottom."""
    img = make_blank()
    draw_line(img, 3, 6, 25, 6, thickness=2)
    draw_line(img, 25, 6, 25, 22, thickness=2)
    return img


def draw_I():
    """I: single vertical stroke."""
    img = make_blank()
    draw_line(img, 3, 14, 25, 14, thickness=2)
    return img


def draw_T():
    """T: horizontal crossbar at top with vertical stem."""
    img = make_blank()
    draw_line(img, 3, 4, 3, 24, thickness=2)
    draw_line(img, 3, 14, 25, 14, thickness=2)
    return img


def draw_Z():
    """Z: horizontal top, diagonal, horizontal bottom."""
    img = make_blank()
    draw_line(img, 3, 4, 3, 24, thickness=2)
    draw_line(img, 3, 24, 25, 4, thickness=2)
    draw_line(img, 25, 4, 25, 24, thickness=2)
    return img


def draw_S():
    """S: curvy (two arcs)."""
    img = make_blank()
    draw_arc(img, 10, 14, 7, 90, 310, thickness=2)
    draw_arc(img, 18, 14, 7, 270, 490, thickness=2)
    return img


# =========================================================================
# Synthetic letter drawings — Round 3 (B/D, M/N, P/R, C/G, O/Q, H/N)
# =========================================================================

def draw_B():
    """B: vertical stem left, two SEPARATE bumps on the right (pinch in middle)."""
    img = make_blank()
    # Vertical stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Top bump (smaller, non-overlapping)
    draw_arc(img, 8, 8, 5, -80, 80, thickness=2)
    # Bottom bump (smaller, non-overlapping)
    draw_arc(img, 20, 8, 5, -80, 80, thickness=2)
    return img


def draw_D():
    """D: vertical stem left, single wide curve on the right."""
    img = make_blank()
    # Vertical stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Single large arc bulging right
    draw_arc(img, 14, 6, 11, -90, 90, thickness=2)
    return img


def draw_M():
    """M: two vertical stems with two interior diagonals going down then up."""
    img = make_blank()
    # Left stem
    draw_line(img, 3, 4, 25, 4, thickness=2)
    # Right stem
    draw_line(img, 3, 24, 25, 24, thickness=2)
    # Inner V diagonals
    draw_line(img, 3, 4, 16, 14, thickness=2)
    draw_line(img, 16, 14, 3, 24, thickness=2)
    return img


def draw_N():
    """N: two vertical stems connected by a single diagonal."""
    img = make_blank()
    # Left stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Right stem
    draw_line(img, 3, 22, 25, 22, thickness=2)
    # Diagonal
    draw_line(img, 3, 6, 25, 22, thickness=2)
    return img


def draw_P():
    """P: vertical stem with a bump at top, nothing at bottom."""
    img = make_blank()
    # Vertical stem (full height)
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Top bump (arc) on the right
    draw_arc(img, 9, 6, 6, -90, 90, thickness=2)
    return img


def draw_R():
    """R: like P but with a leg going down-right from mid-height."""
    img = make_blank()
    # Vertical stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Top bump
    draw_arc(img, 9, 6, 6, -90, 90, thickness=2)
    # Leg going down-right from the bump junction
    draw_line(img, 15, 10, 25, 22, thickness=2)
    return img


def draw_C():
    """C: open curve (arc) opening to the right."""
    img = make_blank()
    draw_arc(img, 14, 14, 10, 40, 320, thickness=2)
    return img


def draw_G():
    """G: like C but with a horizontal bar at mid-height on the right."""
    img = make_blank()
    # Main arc (same as C)
    draw_arc(img, 14, 14, 10, 40, 320, thickness=2)
    # Horizontal bar extending inward from the right at mid-height
    draw_line(img, 14, 14, 14, 24, thickness=2)
    return img


def draw_O():
    """O: closed ellipse / circle."""
    img = make_blank()
    draw_arc(img, 14, 14, 10, 0, 360, thickness=2)
    return img


def draw_Q():
    """Q: circle with a small tail at the bottom-right."""
    img = make_blank()
    draw_arc(img, 14, 14, 10, 0, 360, thickness=2)
    # Tail going down-right from bottom of circle
    draw_line(img, 22, 18, 26, 25, thickness=2)
    return img


def draw_H():
    """H: two vertical stems connected by a horizontal bar in the middle."""
    img = make_blank()
    # Left stem
    draw_line(img, 3, 6, 25, 6, thickness=2)
    # Right stem
    draw_line(img, 3, 22, 25, 22, thickness=2)
    # Horizontal crossbar
    draw_line(img, 14, 6, 14, 22, thickness=2)
    return img


# =========================================================================
# Tests
# =========================================================================

def test_w_v_u():
    """Test the three-way W/V/U resolver."""
    print("--- W/V/U resolver ---")
    
    v_img = draw_V()
    w_img = draw_W()
    u_img = draw_U()
    
    v_result = _resolve_w_v_u(v_img)
    w_result = _resolve_w_v_u(w_img)
    u_result = _resolve_w_v_u(u_img)
    
    print(f"  V image → {v_result} (expected V) {'✓' if v_result == 'V' else '✗ FAIL'}")
    print(f"  W image → {w_result} (expected W) {'✓' if w_result == 'W' else '✗ FAIL'}")
    print(f"  U image → {u_result} (expected U) {'✓' if u_result == 'U' else '✗ FAIL'}")
    
    return v_result == 'V' and w_result == 'W' and u_result == 'U'


def test_e_vs_f():
    """Test E/F resolver."""
    print("--- E/F resolver ---")
    
    e_img = draw_E()
    f_img = draw_F()
    
    e_result = _resolve_e_vs_f(e_img)
    f_result = _resolve_e_vs_f(f_img)
    
    print(f"  E image → {e_result} (expected E) {'✓' if e_result == 'E' else '✗ FAIL'}")
    print(f"  F image → {f_result} (expected F) {'✓' if f_result == 'F' else '✗ FAIL'}")
    
    return e_result == 'E' and f_result == 'F'


def test_l_vs_i():
    """Test L/I resolver."""
    print("--- L/I resolver ---")
    
    l_img = draw_L()
    i_img = draw_I()
    
    l_result = _resolve_l_vs_i(l_img)
    i_result = _resolve_l_vs_i(i_img)
    
    print(f"  L image → {l_result} (expected L) {'✓' if l_result == 'L' else '✗ FAIL'}")
    print(f"  I image → {i_result} (expected I) {'✓' if i_result == 'I' else '✗ FAIL'}")
    
    return l_result == 'L' and i_result == 'I'


def test_z_vs_s():
    """Test Z/S resolver."""
    print("--- Z/S resolver ---")
    
    z_img = draw_Z()
    s_img = draw_S()
    
    z_result = _resolve_z_vs_s(z_img)
    s_result = _resolve_z_vs_s(s_img)
    
    print(f"  Z image → {z_result} (expected Z) {'✓' if z_result == 'Z' else '✗ FAIL'}")
    print(f"  S image → {s_result} (expected S) {'✓' if s_result == 'S' else '✗ FAIL'}")
    
    return z_result == 'Z' and s_result == 'S'


def test_i_vs_t():
    """Test I/T resolver."""
    print("--- I/T resolver ---")
    
    i_img = draw_I()
    t_img = draw_T()
    
    i_result = _resolve_i_vs_t(i_img)
    t_result = _resolve_i_vs_t(t_img)
    
    print(f"  I image → {i_result} (expected I) {'✓' if i_result == 'I' else '✗ FAIL'}")
    print(f"  T image → {t_result} (expected T) {'✓' if t_result == 'T' else '✗ FAIL'}")
    
    return i_result == 'I' and t_result == 'T'


def test_b_vs_d():
    """Test B/D resolver."""
    print("--- B/D resolver ---")

    b_img = draw_B()
    d_img = draw_D()

    b_result = _resolve_b_vs_d(b_img)
    d_result = _resolve_b_vs_d(d_img)

    print(f"  B image -> {b_result} (expected B) {'✓' if b_result == 'B' else '✗ FAIL'}")
    print(f"  D image -> {d_result} (expected D) {'✓' if d_result == 'D' else '✗ FAIL'}")

    return b_result == 'B' and d_result == 'D'


def test_m_vs_n():
    """Test M/N resolver."""
    print("--- M/N resolver ---")

    m_img = draw_M()
    n_img = draw_N()

    m_result = _resolve_m_vs_n(m_img)
    n_result = _resolve_m_vs_n(n_img)

    print(f"  M image -> {m_result} (expected M) {'✓' if m_result == 'M' else '✗ FAIL'}")
    print(f"  N image -> {n_result} (expected N) {'✓' if n_result == 'N' else '✗ FAIL'}")

    return m_result == 'M' and n_result == 'N'


def test_p_vs_r():
    """Test P/R resolver."""
    print("--- P/R resolver ---")

    p_img = draw_P()
    r_img = draw_R()

    p_result = _resolve_p_vs_r(p_img)
    r_result = _resolve_p_vs_r(r_img)

    print(f"  P image -> {p_result} (expected P) {'✓' if p_result == 'P' else '✗ FAIL'}")
    print(f"  R image -> {r_result} (expected R) {'✓' if r_result == 'R' else '✗ FAIL'}")

    return p_result == 'P' and r_result == 'R'


def test_c_vs_g():
    """Test C/G resolver."""
    print("--- C/G resolver ---")

    c_img = draw_C()
    g_img = draw_G()

    c_result = _resolve_c_vs_g(c_img)
    g_result = _resolve_c_vs_g(g_img)

    print(f"  C image -> {c_result} (expected C) {'✓' if c_result == 'C' else '✗ FAIL'}")
    print(f"  G image -> {g_result} (expected G) {'✓' if g_result == 'G' else '✗ FAIL'}")

    return c_result == 'C' and g_result == 'G'


def test_o_vs_q():
    """Test O/Q resolver."""
    print("--- O/Q resolver ---")

    o_img = draw_O()
    q_img = draw_Q()

    o_result = _resolve_o_vs_q(o_img)
    q_result = _resolve_o_vs_q(q_img)

    print(f"  O image -> {o_result} (expected O) {'✓' if o_result == 'O' else '✗ FAIL'}")
    print(f"  Q image -> {q_result} (expected Q) {'✓' if q_result == 'Q' else '✗ FAIL'}")

    return o_result == 'O' and q_result == 'Q'


def test_h_vs_n():
    """Test H/N resolver."""
    print("--- H/N resolver ---")

    h_img = draw_H()
    n_img = draw_N()

    h_result = _resolve_h_vs_n(h_img)
    n_result = _resolve_h_vs_n(n_img)

    print(f"  H image -> {h_result} (expected H) {'✓' if h_result == 'H' else '✗ FAIL'}")
    print(f"  N image -> {n_result} (expected N) {'✓' if n_result == 'N' else '✗ FAIL'}")

    return h_result == 'H' and n_result == 'N'


def test_structural_plausibility():
    """Test structural plausibility scoring for various letters."""
    print("--- Structural plausibility ---")
    all_pass = True

    # I should look like I (narrow, tall)
    i_img = draw_I()
    i_score = _structural_plausibility(i_img, 'I')
    p1 = i_score > 0.3
    print(f"  I image scored as I: {i_score:.2f} (>0.3) {'✓' if p1 else '✗ FAIL'}")
    all_pass &= p1

    # E should score well as E
    e_img = draw_E()
    e_score = _structural_plausibility(e_img, 'E')
    p2 = e_score > 0.3
    print(f"  E image scored as E: {e_score:.2f} (>0.3) {'✓' if p2 else '✗ FAIL'}")
    all_pass &= p2

    # O should score well as O (roughly square, enclosed)
    o_img = draw_O()
    o_score = _structural_plausibility(o_img, 'O')
    p3 = o_score > 0.3
    print(f"  O image scored as O: {o_score:.2f} (>0.3) {'✓' if p3 else '✗ FAIL'}")
    all_pass &= p3

    return all_pass


def test_rerank_geometry():
    """Test the _rerank_with_geometry function end-to-end."""
    print("--- Geometric reranking ---")
    
    # Simulate: model says V as top-1 but the image is actually W
    w_img = draw_W()
    fake_predictions = [
        {'label': 'V', 'confidence': 0.08, 'index': 21},
        {'label': 'W', 'confidence': 0.07, 'index': 22},
        {'label': 'U', 'confidence': 0.04, 'index': 20},
    ]
    new_label, new_conf, new_preds = _rerank_with_geometry(w_img, fake_predictions)
    pass_1 = new_label == 'W'
    print(f"  W image, model says V → reranked to {new_label} {'✓' if pass_1 else '✗ FAIL'}")
    
    # Simulate: model says W as top-1 but image is actually V
    v_img = draw_V()
    fake_predictions2 = [
        {'label': 'W', 'confidence': 0.08, 'index': 22},
        {'label': 'V', 'confidence': 0.07, 'index': 21},
    ]
    new_label2, _, _ = _rerank_with_geometry(v_img, fake_predictions2)
    pass_2 = new_label2 == 'V'
    print(f"  V image, model says W → reranked to {new_label2} {'✓' if pass_2 else '✗ FAIL'}")
    
    # Simulate: model says V as top-1 but image is U
    u_img = draw_U()
    fake_predictions3 = [
        {'label': 'V', 'confidence': 0.08, 'index': 21},
        {'label': 'U', 'confidence': 0.06, 'index': 20},
    ]
    new_label3, _, _ = _rerank_with_geometry(u_img, fake_predictions3)
    pass_3 = new_label3 == 'U'
    print(f"  U image, model says V → reranked to {new_label3} {'✓' if pass_3 else '✗ FAIL'}")
    
    # Simulate: model says E as top-1 but image is F
    f_img = draw_F()
    fake_predictions4 = [
        {'label': 'E', 'confidence': 0.08, 'index': 4},
        {'label': 'F', 'confidence': 0.07, 'index': 5},
    ]
    new_label4, _, _ = _rerank_with_geometry(f_img, fake_predictions4)
    pass_4 = new_label4 == 'F'
    print(f"  F image, model says E → reranked to {new_label4} {'✓' if pass_4 else '✗ FAIL'}")
    
    return pass_1 and pass_2 and pass_3 and pass_4


if __name__ == '__main__':
    print("=" * 60)
    print("GEOMETRIC RESOLVER TESTS")
    print("=" * 60)
    
    results = []
    results.append(("W/V/U", test_w_v_u()))
    results.append(("E/F", test_e_vs_f()))
    results.append(("L/I", test_l_vs_i()))
    results.append(("Z/S", test_z_vs_s()))
    results.append(("I/T", test_i_vs_t()))
    results.append(("B/D", test_b_vs_d()))
    results.append(("M/N", test_m_vs_n()))
    results.append(("P/R", test_p_vs_r()))
    results.append(("C/G", test_c_vs_g()))
    results.append(("O/Q", test_o_vs_q()))
    results.append(("H/N", test_h_vs_n()))
    results.append(("Structural", test_structural_plausibility()))
    results.append(("Rerank", test_rerank_geometry()))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    all_pass = True
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {name}: {status}")
        if not passed:
            all_pass = False
    
    print(f"\nOverall: {'ALL PASSED' if all_pass else 'SOME FAILED'}")
    sys.exit(0 if all_pass else 1)
