import { test, expect } from "@playwright/test";
import { parseQuickTask, type QuickParseContext } from "@/domain/quick-parse";

// Sexta-feira, 6 de novembro de 2026.
const ctx: QuickParseContext = {
  today: "2026-11-06",
  projects: [
    { id: "p1", name: "Operação Pessoal" },
    { id: "p2", name: "Financeiro" }
  ],
  tags: [
    { id: "t1", name: "Cliente" },
    { id: "t2", name: "Deep work" }
  ],
  priorities: [
    { key: "high", label: "Alta" },
    { key: "medium", label: "Média" },
    { key: "low", label: "Baixa" },
    { key: "urgente-x", label: "Urgentíssima" }
  ]
};

test.describe("parseQuickTask", () => {
  test("reconhece todos os marcadores e limpa o título", () => {
    const result = parseQuickTask("Revisar contrato amanhã #financeiro !alta @cliente ~45min", ctx);
    expect(result.title).toBe("Revisar contrato");
    expect(result.dueDate).toBe("2026-11-07");
    expect(result.projectId).toBe("p2");
    expect(result.priority).toBe("high");
    expect(result.tagIds).toEqual(["t1"]);
    expect(result.estimateMinutes).toBe(45);
  });

  test("datas relativas e absolutas", () => {
    expect(parseQuickTask("pagar conta hoje", ctx).dueDate).toBe("2026-11-06");
    expect(parseQuickTask("pagar conta depois de amanhã", ctx).dueDate).toBe("2026-11-08");
    expect(parseQuickTask("ligar segunda", ctx).dueDate).toBe("2026-11-09");
    expect(parseQuickTask("ligar na sexta-feira", ctx).dueDate).toBe("2026-11-13");
    expect(parseQuickTask("entregar 20/11", ctx).dueDate).toBe("2026-11-20");
    expect(parseQuickTask("entregar 03/01", ctx).dueDate).toBe("2027-01-03");
    expect(parseQuickTask("boleto dia 10", ctx).dueDate).toBe("2026-11-10");
    expect(parseQuickTask("boleto dia 3", ctx).dueDate).toBe("2026-12-03");
    expect(parseQuickTask("planejar semana que vem", ctx).dueDate).toBe("2026-11-09");
    expect(parseQuickTask("revisar em 3 dias", ctx).dueDate).toBe("2026-11-09");
  });

  test("não confunde palavras comuns com dias da semana", () => {
    const result = parseQuickTask("ter reunião sobre seguro do quarto", ctx);
    expect(result.dueDate).toBeUndefined();
    expect(result.title).toBe("ter reunião sobre seguro do quarto");
  });

  test("projeto com nome composto, acento e prefixo", () => {
    expect(parseQuickTask("x #operacao-pessoal", ctx).projectId).toBe("p1");
    expect(parseQuickTask("x #opera", ctx).projectId).toBe("p1");
  });

  test("prioridade por número e por rótulo customizado", () => {
    expect(parseQuickTask("x !1", ctx).priority).toBe("high");
    expect(parseQuickTask("x !3", ctx).priority).toBe("low");
    expect(parseQuickTask("x !urgentissima", ctx).priority).toBe("urgente-x");
  });

  test("recorrência e estimativas compostas", () => {
    const result = parseQuickTask("Treinar todo dia ~1h30", ctx);
    expect(result.recurrence).toBe("daily");
    expect(result.estimateMinutes).toBe(90);
    expect(result.title).toBe("Treinar");
    expect(result.dueDate).toBeUndefined();
  });

  test("marcadores desconhecidos viram aviso e ficam no título", () => {
    const result = parseQuickTask("Corrigir bug #123 com @nada amanhã", ctx);
    expect(result.projectId).toBeUndefined();
    expect(result.tagIds).toEqual([]);
    expect(result.tokens.filter((token) => token.kind === "unknown")).toHaveLength(2);
    expect(result.title).toBe("Corrigir bug #123 com @nada");
    expect(result.dueDate).toBe("2026-11-07");
  });

  test("horário fica no título (prazo é só data)", () => {
    const result = parseQuickTask("Dentista amanhã 14h", ctx);
    expect(result.dueDate).toBe("2026-11-07");
    expect(result.title).toBe("Dentista 14h");
  });

  test("e-mail e C# não viram marcador", () => {
    const result = parseQuickTask("Responder ana@empresa.com sobre C#", ctx);
    expect(result.tokens).toHaveLength(0);
    expect(result.title).toBe("Responder ana@empresa.com sobre C#");
  });
});
