# Services module
from .ml_service import (
    load_model,
    predict_letter,
    predict_letter_dyslexia_friendly,
    preprocess_image,
    get_model_info,
    are_letters_similar,
    get_similar_letters,
    ALPHANUMERIC_LABELS,
    SIMILAR_LETTER_GROUPS,
    STRICT_DISTINCTION_PAIRS
)

from .digit_service import (
    load_digit_model,
    predict_digit,
    preprocess_digit_image,
    get_digit_model_info,
    DIGIT_LABELS
)

from .keepalive_service import (
    start_keepalive_worker,
)
