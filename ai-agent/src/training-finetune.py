# 1. Installer Unsloth (à lancer dans une cellule Colab)
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# !pip install --no-deps xformers trl peft accelerate bitsandbytes

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 2. Charger le modèle de base (le même que ton Ollama)
max_seq_length = 2048
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Qwen2.5-3B-Instruct",
    max_seq_length = max_seq_length,
    dtype = None,
    load_in_4bit = True, # Économise la RAM
)

# 3. Ajouter les adaptateurs LoRA (ce qui permet l'entraînement rapide)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
)

# 4. Charger et formater ton dataset
dataset = load_dataset("json", data_files={"train": "dataset.jsonl"}, split="train")

def format_chat_template(row):
    # Applique le format de chat Qwen à tes messages
    row["text"] = tokenizer.apply_chat_template(row["messages"], tokenize=False, add_generation_prompt=False)
    return row

dataset = dataset.map(format_chat_template)

# 5. Lancer l'entraînement
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Augmente à 200-300 selon la taille de ton dataset
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer.train()

# 6. Exporter le modèle magique pour Ollama (format GGUF) !
model.save_pretrained_gguf("qwen2.5-erp-model", tokenizer, quantization_method = "q4_k_m")