# Evento Baileys `groups.update`

## Formato do payload

- Tipo: **`Partial<GroupMetadata>[]`** (array de metadados parciais por grupo).
- Cada item pode incluir, entre outros, `id`, `subject`, `desc`, `author`, `authorPn`, etc.
- O WhatsApp pode enviar **apenas os campos que mudaram**; ausência de `desc` não significa “descrição vazia”, significa “este evento não traz alteração de descrição”.

## Exemplo (descrição alterada)

```json
[
  {
    "id": "120363426026043948@g.us",
    "desc": "mudando descrição 💼",
    "author": "75655932829836@lid",
    "authorPn": undefined
  }
]
```

## Fluxo de persistência (Postgres)

1. **`BaileysSocketService`** recebe `socket.ev('groups.update')`, regista o payload em consola de debug e invoca os callbacks registados com **`onGroupsUpdate`**.
2. **`PatchGroupFromGroupsUpdateUseCase`** percorre cada item:
   - Ignora `id` que não termine em `@g.us`.
   - Resolve o grupo por **`whatsappRegistry` = `id`** do evento. Se **não existir linha** em `groups_wpp`, **não cria** grupo — apenas regista skip em log (o primeiro contacto costuma ser `groups.upsert` / join).
   - **Imagem (`groups_wpp.imageUrl`)**: em **todo** item processado, chama **`getProfilePictureUrl(gid)`** e grava o URL devolvido (ou `null` se não houver foto). A foto **não** vem no evento; só assim garantimos alinhamento após troca de ícone do grupo.
   - **Descrição (`groups_wpp.description`)**: só atualiza se **`'desc' in partial`** (propriedade presente no objeto). O valor gravado é `partial.desc`, permitindo `null` para limpar quando o protocolo enviar assim.

## Referências no código

- Listener e callbacks: `BaileysSocketService` (`groups.update` + `onGroupsUpdate`).
- Caso de uso: `PatchGroupFromGroupsUpdateUseCase`.
