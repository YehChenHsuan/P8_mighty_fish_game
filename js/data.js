/**
 * ALICE ESL Phonics P8 - 大魚吃小魚英文冒險題庫 (data.js)
 * 課本學習範圍：Page 08 - 13
 * 主題：Diphthongs & Body Parts
 */

window.BOOK_ID = "P8";
const FISH_QUESTIONS = [
  {
    "id": "fish-qa-1",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Can the airplane fly in the sky?",
    "questionZh": "飛機能在空中飛翔嗎？",
    "speechText": "Can the airplane fly in the sky?",
    "options": [
      "Yes, it can.",
      "No, it can't.",
      "Yes, it boil."
    ],
    "correct": "Yes, it can.",
    "audioFallback": "P8_flashcards_audios/P8_airplane.mp3",
    "theme": "Diphthongs & Body Parts"
  },
  {
    "id": "fish-qa-2",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Can you touch your toes?",
    "questionZh": "你能碰到你的腳趾嗎？",
    "speechText": "Can you touch your toes?",
    "options": [
      "Yes, I can.",
      "No, I can't.",
      "No, I rain."
    ],
    "correct": "Yes, I can.",
    "audioFallback": "P8_flashcards_audios/P8_toes.mp3",
    "theme": "Diphthongs & Body Parts"
  },
  {
    "id": "fish-qa-3",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Which word has diphthong ai?",
    "questionZh": "哪一個單字有雙母音 ai？",
    "speechText": "Which word has diphthong ai?",
    "options": [
      "rain",
      "boy",
      "soil"
    ],
    "correct": "rain",
    "audioFallback": "P8_flashcards_audios/P8_rain.mp3",
    "theme": "Diphthongs & Body Parts"
  },
  {
    "id": "fish-qa-4",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Which word has diphthong oi?",
    "questionZh": "哪一個單字有雙母音 oi？",
    "speechText": "Which word has diphthong oi?",
    "options": [
      "coin",
      "sail",
      "chair"
    ],
    "correct": "coin",
    "audioFallback": "P8_flashcards_audios/P8_coin.mp3",
    "theme": "Diphthongs & Body Parts"
  },
  {
    "id": "fish-qa-5",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Which word has diphthong oy?",
    "questionZh": "哪一個單字有雙母音 oy？",
    "speechText": "Which word has diphthong oy?",
    "options": [
      "toy",
      "train",
      "point"
    ],
    "correct": "toy",
    "audioFallback": "P8_flashcards_audios/P8_toy.mp3",
    "theme": "Diphthongs & Body Parts"
  },
  {
    "id": "fish-qa-6",
    "type": "QA",
    "source": "ALICE ESL Phonics P8 Page 08 - 13",
    "questionEn": "Which word is a body part?",
    "questionZh": "哪一個單字是身體部位？",
    "speechText": "Which word is a body part?",
    "options": [
      "arm",
      "airplane",
      "soybean"
    ],
    "correct": "arm",
    "audioFallback": "P8_flashcards_audios/P8_arm.mp3",
    "theme": "Diphthongs & Body Parts"
  }
];

if (typeof window !== "undefined") {
  window.FISH_QUESTIONS = FISH_QUESTIONS;
  window.P8_FISH_QUESTIONS = FISH_QUESTIONS;
  window.P1_FISH_QUESTIONS = FISH_QUESTIONS;
  window[`${window.BOOK_ID}_FISH_QUESTIONS`] = FISH_QUESTIONS;
}
