# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/
from types import SimpleNamespace

import jellyfish
from nltk.translate.bleu_score import sentence_bleu
from rouge import Rouge

from genai_core.model import DFDComponent

r = Rouge()


def f1_score(reference, hypothesis):
    rouge_scores = r.get_scores(hyps=hypothesis, refs=reference)
    rouge_l_f = rouge_scores[0]['rouge-l']['f']

    bleu = sentence_bleu(references=[reference], hypothesis=hypothesis)

    f1 = 2 * (rouge_l_f * bleu) / (rouge_l_f + bleu)

    return f1


def is_similar(name1: str, name2: str, threshold: float) -> bool:
    # Calculate the Jaro-Winkler similarity
    similarity = jellyfish.jaro_winkler_similarity(name1, name2)
    return similarity >= threshold


def match_entities(predicted: list[DFDComponent], ground_truth: list[DFDComponent], threshold: float):
    matched_predicted = set()
    matched_ground_truth = set()

    for i, gt in enumerate(ground_truth):
        for j, pred in enumerate(predicted):
            if j not in matched_predicted and is_similar(pred.name, gt.name, threshold) and pred.component_type == gt.component_type:
                matched_predicted.add(j)
                matched_ground_truth.add(i)
                break

    return matched_predicted, matched_ground_truth


def evaluate_extraction(predicted: list[DFDComponent], ground_truth: list[DFDComponent], threshold: float = 0.85):
    matched_predicted, matched_ground_truth = match_entities(predicted, ground_truth, threshold)

    true_positives = len(matched_ground_truth)
    false_positives = len(predicted) - true_positives
    false_negatives = len(ground_truth) - true_positives

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    return {
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }
