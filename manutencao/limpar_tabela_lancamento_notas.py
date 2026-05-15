import sqlite3

banco = r'C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db'

conn = sqlite3.connect(banco)
cursor = conn.cursor()

cursor.execute("DELETE FROM lancamento_notas")

conn.commit()
conn.close()

print("✅ Tabela limpa com sucesso!")