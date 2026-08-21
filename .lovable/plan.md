# Plan: Dakar Essence Improvements - Phase 2 (Verified)

## Context & Strategy
- **Notion Database**: `38858811-29ca-83c5-b57d-0102c05505b1`.
- **Google Sheets**: `1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw`.
- **Stock Strategy**: **Strategy C** (Confirm at acceptance).
- **Core Principle**: Processamento protegido com compensação (not atomic, but resilient).

## 1. Permanent Perfume Numbers (Notion)
- **Database Schema**: Add `Número` (type: `number`) to Notion.
- **Migration Protocol**:
    1.  **Read & Map**: Fetch all perfumes.
    2.  **Validation Report**: Generate a report (Notion ID, Name, Collection, Volume, current index number, proposed permanent number).
    3.  **Approval**: Wait for user approval of the report.
    4.  **Write**: Persist numbers to Notion.
- **Auto-Increment**: New items automatically get `Max(Número) + 1`.
- **Display**: Use `Nº XXX` formatting in UI, but store as a raw number.

## 2. Protected Stock Processing (Strategy C)
- **Workflow: Accept Sale (Concluído)**:
    1.  **Group**: Aggregate duplicate items in the order.
    2.  **Validate**: Fetch latest Notion stock for all items. Block if any item has `amount < requested`.
    3.  **Sheets Record**: Create row in `MovimentacoesEstoque` with status `INICIADA`.
    4.  **Notion Update**: Update products one by one. Record each success.
    5.  **Compensation**: If any fails, attempt to increment (revert) already processed items.
    6.  **Final Status**: Mark Sheets movement as `APLICADA`, `REVERTIDA`, or `PRECISA_RECONCILIACAO`.
- **Order Gate**: A status change to `Concluído` is only finalized if the movement is `APLICADA`.
- **Cycle IDs**: `PED-XXXX:CICLO-N:BAIXA` / `DEVOLUCAO`. Increment `EstoqueCiclo` on Reopen.

## 3. Google Sheets Evolution
- **Dynamic Headers**: Detect columns by name, not fixed index.
- **New Tab `MovimentacoesEstoque`**:
    - Columns: `MovimentoID`, `PedidoID`, `Ciclo`, `Ação`, `Status`, `DataInicio`, `DataFim`, `Itens`, `Erro`, `Usuario`.
- **Pedidos Tab Updates**: Add `Telefone`, `EstoqueCiclo`, `UltimoMovimentoStatus`.

## 4. Checkout & Admin UX
- **CartDrawer**: Add validated phone field (10/11 digits). Prepend `55` for WhatsApp.
- **Availability Labels**: `Amount === 1` shows "Última unidade — disponibilidade sujeita a confirmação".
- **Admin**:
    - WhatsApp button "Falar com o cliente".
    - Search by phone number.
    - Alert for movements stuck in `INICIADA` or `PRECISA_RECONCILIACAO`.

## 5. Recovery & Resilience
- **Idempotency**: Check `MovimentacoesEstoque` before starting any new action.
- **Retry Logic**: If Sheets final update fails, keep status as `INICIADA` to flag a potentially successful Notion update that missed its final Sheets log.

## Verification Checklist (Tests)
- [ ] Partial failure recovery (Notion update 1 succeeds, update 2 fails -> revert 1).
- [ ] Reversion failure -> mark `PRECISA_RECONCILIACAO`.
- [ ] Double-click protection (idempotency check).
- [ ] Cycle increment on Cancel -> Reopen -> Conclude.
- [ ] Orders without phone/cycle data (graceful fallback).
