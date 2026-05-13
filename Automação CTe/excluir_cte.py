import os
import sqlite3

def excluir_cte(numero_cte):
    # Caminho absoluto baseado no diretório do script
    caminho_banco = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'app.db'))
    conexao = sqlite3.connect(caminho_banco)
    cursor = conexao.cursor()
    
    cursor.execute("DELETE FROM lancamento_fiscal WHERE numero_cte = ?", (numero_cte,))
    conexao.commit()
    
    print(f"Registros com numero_cte {numero_cte} excluídos.")
    
    cursor.close()
    conexao.close()

if __name__ == "__main__":
    numero_cte = input("Digite o número do CTE para excluir: ")
    excluir_cte(numero_cte)