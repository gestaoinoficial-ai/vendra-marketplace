# Importador de Engenheiros (Parceiros)

Script para importar credenciais de engenheiros de um arquivo Excel para o Supabase.

## Como Usar

### 1. Preparar o arquivo Excel

O arquivo deve conter as seguintes colunas:
- `Nome Completo do Empresário`
- `Nome Fantasia`
- `Razão Social`
- `CPF ou CNPJ do contratante`
- `E-mail`
- `Telefone principal para contato`
- `Especialista em qual área`
- `Cidade`
- `Endereço Completo`
- `Raio atuação`
- `Número de registro profissional`

### 2. Executar o script

```bash
node import-engenheiros.js ./seu-arquivo.xlsx
```

Ou se o arquivo estiver em outra localização:

```bash
node import-engenheiros.js /caminho/completo/engenheiros.xlsx
```

### 3. O que o script faz

✅ **Leitura**: Lê o arquivo Excel
✅ **Transformação**: Converte dados para o formato do banco
✅ **Geocodificação**: Usa Nominatim (OpenStreetMap) para converter endereços em lat/lng
✅ **Importação**: Insere os engenheiros na tabela `parceiros` do Supabase
✅ **Relatório**: Mostra quantos foram importados com sucesso e quais falharam
✅ **Git**: Faz commit e push automáticos

## Mapeamento de Campos

| Excel | Supabase | Processamento |
|-------|----------|--------------|
| Nome Completo do Empresário | nome_empresario | direto |
| Nome Fantasia | nome_fantasia | direto |
| Razão Social | razao_social | direto |
| CPF ou CNPJ do contratante | cpf_cnpj | direto |
| E-mail | email | direto |
| Telefone principal para contato | telefone | direto |
| Especialista em qual área | especialidades | split por , ou ; |
| Cidade | regiao_atuacao | direto |
| Endereço Completo | endereco, latitude, longitude | geocodificado |
| Raio atuação | raio_atuacao_km | parsing numérico |
| Número de registro profissional | crea_cau | direto |
| — | status | "aprovado" |
| — | disponivel | true |

## Rate Limiting

O script aguarda **1 segundo entre cada geocodificação** para respeitar os limites da API Nominatim. Para 100 engenheiros, o tempo total é aproximadamente 2-3 minutos.

## Exemplos de Saída

```
📂 Lendo arquivo Excel...
✓ 11 linhas encontradas
Row 2: ✓ Caio Vendramin (-22.9056, -47.0608)
Row 3: ✓ Adriana Coelho (-23.5505, -46.6333)
Row 4: ✓ Rafael Lago (sem geo)
...

============================================================
📊 RESULTADO DA IMPORTAÇÃO
============================================================
✅ Sucesso: 10
❌ Falhas: 1

⚠️  Falhas:
  - Row 4 (Rafael Lago): Email inválido
```

## Requisitos

- Node.js 18+
- Arquivo Excel (.xlsx)
- Conexão à internet (para Nominatim)
- Git configurado (para commit automático)

## Troubleshooting

**"Arquivo não encontrado"**
- Verifique se o caminho está correto
- Use caminho absoluto se tiver espaços no nome

**"Erro ao geocodificar"**
- O endereço é muito vago (ex: "Brasil")
- Tente com endereço mais específico (rua, número, cidade)
- Nominatim pode estar indisponível (tente depois)

**"Erro ao conectar ao Supabase"**
- Verifique a URL e chave de serviço
- Tabela `parceiros` existe no banco?
- Firewall pode estar bloqueando

## Desenvolvimento

Se quiser modificar o script:
- Campos mapeados: veja função `importEngenheiros`
- Geocodificação: função `geocodeAddress`
- Parsing: funções `parseEspecialidades` e `parseRaio`
