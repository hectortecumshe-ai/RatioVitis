"""Referencia independiente de las métricas de red de Ratio Vitis (Bloque 10), calculada con NetworkX.
Escribe casos_red.json: grafos dirigidos aleatorios con su grado y su intermediación (no dirigidos, sin pesos,
normalizada) y el número de ciclos dirigidos simples de longitud ≤ 7. La app los recalcula en Validación."""
import json, os, random
import networkx as nx

random.seed(10)
casos = []
for c in range(30):
    n = random.randint(6, 26); p = random.uniform(0.06, 0.22)
    ids = [f'n{i}' for i in range(n)]
    arcos = [(a, b, random.choice([1, -1])) for a in ids for b in ids if a != b and random.random() < p]
    G = nx.Graph(); G.add_nodes_from(ids); G.add_edges_from((a, b) for a, b, _ in arcos)
    D = nx.DiGraph(); D.add_nodes_from(ids); D.add_edges_from((a, b) for a, b, _ in arcos)
    bet = nx.betweenness_centrality(G, normalized=True)
    ciclos = sum(1 for _ in nx.simple_cycles(D, length_bound=7))
    casos.append(dict(ids=ids, arcos=arcos, grado={k: G.degree(k) for k in ids}, inter=bet, ciclos=ciclos))
json.dump(casos, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'casos_red.json'), 'w'))
print('casos_red.json:', len(casos), 'grafos')
