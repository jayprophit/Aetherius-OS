from transformers import AutoModelForCausalLM, AutoTokenizer
MID = "EleutherAI/gpt-neo-125M"
tok = AutoTokenizer.from_pretrained(MID, trust_remote_code=False)
model = AutoModelForCausalLM.from_pretrained(MID, torch_dtype="float32", trust_remote_code=False)
n = sum(p.numel() for p in model.parameters())
print("params:", n)
print("tok vocab:", tok.vocab_size)
model.save_pretrained("C:/Users/jpowe/Desktop/Projects/Aetherius-OS/research/lm-compression/gpt-neo-125M-fp32")
tok.save_pretrained("C:/Users/jpowe/Desktop/Projects/Aetherius-OS/research/lm-compression/gpt-neo-125M-fp32")
print("saved fp32 snapshot")

