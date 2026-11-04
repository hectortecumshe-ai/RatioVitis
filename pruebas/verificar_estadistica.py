"""Referencia independiente del motor estadístico de Ratio Vitis (Bloque 9), calculada con SciPy.
Escribe casos_estadistica.json: experimentos aleatorios en bloques completos al azar con su ANOVA (F y p),
p de Tukey por par (scipy.stats.studentized_range), Levene centrado en la mediana, Pearson, t crítico y
valores sueltos de la distribución del rango estudentizado. La app los recalcula en su página de Validación."""
import json, os
import numpy as np
from scipy import stats

rng = np.random.default_rng(2026)
casos = []
for c in range(40):
    k = int(rng.integers(3, 7)); b = int(rng.integers(3, 6))
    efecto = rng.normal(0, rng.choice([0.2, 1.5]), k); bloque = rng.normal(0, 1, b)
    obs = [dict(t=f'T{i}', b=f'B{j}', y=float(round(10 + efecto[i] + bloque[j] + rng.normal(0, 1), 4))) for i in range(k) for j in range(b)]
    y = np.array([[next(o['y'] for o in obs if o['t'] == f'T{i}' and o['b'] == f'B{j}') for j in range(b)] for i in range(k)])
    gm = y.mean(); sst = ((y - gm) ** 2).sum(); sstr = b * ((y.mean(1) - gm) ** 2).sum(); ssb = k * ((y.mean(0) - gm) ** 2).sum()
    sse = sst - sstr - ssb; gt, gb = k - 1, b - 1; ge = gt * gb; mse = sse / ge; F = (sstr / gt) / mse
    tuk = []
    for i in range(k):
        for j in range(i + 1, k):
            q = abs(y[i].mean() - y[j].mean()) / np.sqrt(mse / b)
            tuk.append(dict(a=f'T{i}', b=f'T{j}', q=float(q), p=float(stats.studentized_range.sf(q, k, ge))))
    lev = stats.levene(*[y[i] for i in range(k)], center='median')
    casos.append(dict(obs=obs, F=float(F), p=float(stats.f.sf(F, gt, ge)), mse=float(mse), tukey=tuk, levW=float(lev.statistic), levP=float(lev.pvalue)))
corr = []
for c in range(30):
    n = int(rng.integers(5, 40)); x = rng.normal(0, 1, n); yv = rng.normal(0, 1, n) + rng.uniform(-1, 1) * x
    r, p = stats.pearsonr(x, yv); corr.append(dict(x=[float(v) for v in x], y=[float(v) for v in yv], r=float(r), p=float(p)))
ptk = [dict(q=float(q), k=int(k), df=int(df), P=float(stats.studentized_range.cdf(q, k, df))) for q, k, df in [(3.0, 3, 10), (3.5, 4, 6), (4.2, 5, 20), (2.5, 2, 3), (5.0, 6, 12), (3.77, 3, 30), (4.0, 8, 60)]]
tcr = [dict(df=df, t=float(stats.t.ppf(0.975, df))) for df in (1, 2, 5, 10, 30, 100)]
# ---- Modelos lineales por mínimos cuadrados (numpy): SC de cada término = aumento de la SC residual al quitarlo
def dummies(vals):
    niv = sorted(set(vals)); M = np.zeros((len(vals), len(niv) - 1))
    for r, v in enumerate(vals):
        i = niv.index(v)
        if i < len(niv) - 1: M[r, i] = 1
        else: M[r, :] = -1          # codificación de suma cero
    return M
def sc_res(X, y):
    b, *_ = np.linalg.lstsq(X, y, rcond=None); e = y - X @ b; return float(e @ e)
def inter(A, B): return np.column_stack([A[:, i] * B[:, j] for i in range(A.shape[1]) for j in range(B.shape[1])])
ancova = []
for c in range(25):
    k = int(rng.integers(3, 6)); b = int(rng.integers(3, 6))
    filas = []
    for i in range(k):
        for j in range(b):
            x = float(round(rng.uniform(1, 2), 3)); filas.append(dict(t=f'T{i}', b=f'B{j}', x=x, y=float(round(10 + rng.normal(0, 1) + 1.5 * x + (i * rng.uniform(0, 0.8)), 4))))
    y = np.array([f['y'] for f in filas]); xv = np.array([f['x'] for f in filas]); T = dummies([f['t'] for f in filas]); B = dummies([f['b'] for f in filas]); one = np.ones((len(y), 1))
    full = np.column_stack([one, B, T, xv]); sse = sc_res(full, y); ge = len(y) - full.shape[1]
    sst_adj = sc_res(np.column_stack([one, B, xv]), y) - sse; scov = sc_res(np.column_stack([one, B, T]), y) - sse
    F = (sst_adj / (k - 1)) / (sse / ge); Fc = scov / (sse / ge)
    ancova.append(dict(obs=filas, F=float(F), p=float(stats.f.sf(F, k - 1, ge)), Fcov=float(Fc), mse=float(sse / ge)))
tiempo = []
for c in range(20):
    k = int(rng.integers(2, 5)); b = int(rng.integers(2, 5)); d = int(rng.integers(2, 5))
    filas = [dict(t=f'T{i}', b=f'B{j}', d=f'2026-0{m+1}-15', y=float(round(5 + rng.normal(0, 1) + i * 0.3 * m + rng.normal(0, 0.5), 4))) for i in range(k) for j in range(b) for m in range(d)]
    y = np.array([f['y'] for f in filas]); one = np.ones((len(y), 1)); B = dummies([f['b'] for f in filas]); T = dummies([f['t'] for f in filas]); Fd = dummies([f['d'] for f in filas])
    BT, TF = inter(B, T), inter(T, Fd); full = np.column_stack([one, B, T, BT, Fd, TF]); sse = sc_res(full, y)
    drop = lambda *m: sc_res(np.column_stack([one] + list(m)), y) - sse
    sT = drop(B, BT, Fd, TF); sBT = drop(B, T, Fd, TF); sF = drop(B, T, BT, TF); sTF = drop(B, T, BT, Fd)
    gT, gEa, gF, gTF, gEb = k - 1, (b - 1) * (k - 1), d - 1, (k - 1) * (d - 1), k * (b - 1) * (d - 1)
    FT = (sT / gT) / (sBT / gEa); FF = (sF / gF) / (sse / gEb); FTF = (sTF / gTF) / (sse / gEb)
    tiempo.append(dict(obs=filas, FT=float(FT), pT=float(stats.f.sf(FT, gT, gEa)), FF=float(FF), FTF=float(FTF), pTF=float(stats.f.sf(FTF, gTF, gEb))))
out = dict(anova=casos, pearson=corr, ptukey=ptk, tcrit=tcr, ancova=ancova, tiempo=tiempo)
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'casos_estadistica.json'), 'w'))
print('casos_estadistica.json:', len(casos), 'experimentos,', len(corr), 'correlaciones,', len(ptk), 'valores del rango estudentizado')
