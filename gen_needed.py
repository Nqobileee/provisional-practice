# -*- coding: utf-8 -*-
import json, re
from collections import defaultdict, Counter
d = json.load(open('quiz/questions.json', encoding='utf-8'))

def corr(q): return next((o['text'] for o in q['options'] if o['correct']), '')
def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s.lower())).strip()

NEED = re.compile(r'which cars?|this sign|the sign (warns|indicates|means)|at this sign|approaching this sign|this road sign|this traffic light|seeing this sign|meaning of this sign|setup below|such an incline|insignia|grouping of road signs|four way junction|uncontrolled intersection')
NO_IMAGE = re.compile(
    r'\binsignia\b|four way junction|at an uncontrolled intersection, i should give right of way'
)
def needs(q):
    t = q['question'].lower()
    if NO_IMAGE.search(t):
        return False
    return bool(NEED.search(t))

CATEGORY_ANS = {'a triangle','a circle','a rectangle','a direction sign','for information purposes only','is for information','is for warning','a regulatory sign','an informative sign','a danger warning sign'}
def cat(q):
    t = q['question'].lower(); a = norm(corr(q))
    if 'which car' in t or 'intersection' in t or 'traffic circle' in t or 'junction' in t: return 'INTERSECTION'
    if a in CATEGORY_ANS: return 'SIGN-CATEGORY'
    if 'sign' in t: return 'SIGN'
    return 'OTHER'

uniq = {}
for q in d:
    if needs(q) and not q.get('image'):
        k = (norm(q['question']), norm(corr(q)))
        if k not in uniq:
            uniq[k] = {'q': q['question'], 'a': corr(q), 'pages': set(), 'n': 0, 'cat': cat(q)}
        uniq[k]['pages'].add(q['vid_page']); uniq[k]['n'] += 1

def slug(qa):
    return re.sub(r'[^a-z0-9]+', '_', (qa[0] + '_' + qa[1]).lower()).strip('_')[:44]

rows = []
for k, v in uniq.items():
    rows.append((v['cat'], slug(k), v['q'], v['a'], sorted(v['pages']), v['n']))
rows.sort(key=lambda r: (r[0], r[2], r[3]))
# numeric prefix guarantees unique, unambiguous filenames
prefix = {'INTERSECTION': 'x', 'SIGN': 's', 'SIGN-CATEGORY': 'c', 'OTHER': 'o'}
rows = [(c, '%s%02d_%s' % (prefix[c], i + 1, sl), q, a, pages, n)
        for i, (c, sl, q, a, pages, n) in enumerate(rows)]

L = ['# Diagrams Needed (screenshots)', '',
     'Each row is a UNIQUE diagram still missing from the app. Screenshot just the',
     'sign / intersection image, save it using the **Filename** shown (.png or .jpg),',
     'and send them over. I will attach each to its question and auto-propagate it to',
     'every set where the same question repeats.', '',
     'Tip: the VID.pdf page tells you which test the question sits in, so you can find',
     'the matching diagram in the original visual quiz.', '',
     f'Total diagrams needed: **{len(rows)}** (covering {sum(r[5] for r in rows)} question instances)', '',
     '| Filename to save as | Type | VID.pdf page(s) | Question | Correct answer | # uses |',
     '|---|---|---|---|---|---|']
for c, sl, q, a, pages, n in rows:
    fn = '`' + sl + '.png`'
    pg = ', '.join('p.' + str(p) for p in pages)
    L.append('| %s | %s | %s | %s | %s | %d |' % (fn, c, pg, q.replace('|', '/'), a.replace('|', '/'), n))

open('NEEDED_DIAGRAMS.md', 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('wrote NEEDED_DIAGRAMS.md:', len(rows), 'unique diagrams,', sum(r[5] for r in rows), 'instances')
print('by type:', dict(Counter(r[0] for r in rows)))
