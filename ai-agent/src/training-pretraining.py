from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

dataset = load_dataset(
    "json",
    data_files="dataset.jsonl"
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize(example):
    return tokenizer(
        example["text"],
        truncation=True,
        max_length=512
    )

tokenized = dataset.map(tokenize, batched=True)

model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

training_args = TrainingArguments(
    output_dir="./model-output",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    num_train_epochs=3,
    save_steps=100,
    logging_steps=10,
    learning_rate=2e-5,
    fp16=True
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    data_collator=DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
)

trainer.train()

trainer.save_model("./final-model")
tokenizer.save_pretrained("./final-model")