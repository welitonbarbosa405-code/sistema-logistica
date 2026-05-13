def menu():
    print("\n=== CALCULADORA ===")
    print("1 - Soma")
    print("2 - Subtração")
    print("3 - Multiplicação")
    print("4 - Divisão")
    print("0 - Sair")

while True:
    menu()
    opcao = input("Escolha uma opção: ")

    if opcao == "0":
        print("Encerrando a calculadora...")
        break

    if opcao in ["1", "2", "3", "4"]:
        n1 = float(input("Digite o primeiro número: "))
        n2 = float(input("Digite o segundo número: "))

        if opcao == "1":
            print("Resultado:", n1 + n2)
        elif opcao == "2":
            print("Resultado:", n1 - n2)
        elif opcao == "3":
            print("Resultado:", n1 * n2)
        elif opcao == "4":
            if n2 != 0:
                print("Resultado:", n1 / n2)
            else:
                print("Erro: divisão por zero")
    else:
        print("Opção inválida!")