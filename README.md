1️⃣ Global flow (logic)

Type de projet

batiment

industriel

Zone

interieur

exterieur (we’ll do later)

➡️ For now we focus on:
Bâtiment → Intérieur

2️⃣ Intérieur – main choices
Intérieur
 ├── Plafond
 └── Mur


User always inputs:

Surface (m²)

3️⃣ Intérieur → Plafond
Types de plafond
Plafond
 ├── Placo
 ├── Enduit ciment
 ├── Ancien peinturé
 └── Plâtre projeté

🟦 Plafond → Placo (special case)

User chooses:

Fini ✅ / ❌

✔️ Placo fini
Système :
- 1 couche d’impression
- 2 couches de finition

❌ Placo non fini → SYSTEM
Système :
- 1 couche d’impression
- 2 couches d’enduit
- 1 couche primaire (sous-couche)
- 2 couches de finition


➡️ This is what you call a system ✔️

🟦 Other plafond types (always SYSTEM)

For these types, no extra questions:

Enduit ciment

Ancien peinturé

Plâtre projeté

Système standard plafond :
- Préparation support
- Enduit si nécessaire
- Sous-couche
- 2 couches de finition


(You can detail later if needed)

4️⃣ Intérieur → Mur

Mur is always:

SYSTEM + FINITION

🧱 Mur → Finition

User chooses:

Finition
 ├── Simple
 └── Décorative

✔️ Finition simple → Peinture

User selects aspect:

Peinture
 ├── Mat
 ├── Brillant
 └── Satiné

🎨 Finition décorative
Décorative
 ├── Produit décoratif
 └── Papier peint



 {
  "project_type": "batiment",
  "zone": "interieur",
  "element": "plafond | mur",
  "surface_m2": 0,

  "plafond": {
    "type": "placo | enduit_ciment | ancien_peinture | platre_projete",
    "placo": {
      "fini": true,
      "system": [
        "couche_impression",
        "2_couches_finition"
      ]
    },
    "placo_non_fini_system": [
      "couche_impression",
      "2_couches_enduit",
      "couche_primaire",
      "2_couches_finition"
    ]
  },

  "mur": {
    "system": true,
    "finition": {
      "type": "simple | decorative",
      "simple": {
        "peinture": "mat | brillant | satine"
      },
      "decorative": {
        "option": "produit_decoratif | papier_peint"
      }
    }
  }
}





👉 Bâtiment → Extérieur

1️⃣ Bâtiment → Extérieur (main choice)

When user selects Extérieur, show 4 types:

Extérieur
 ├── Neuf
 ├── Monocouche
 ├── Ancien peinturé
 └── Placo


User still inputs:

Surface (m²)

2️⃣ Extérieur → Neuf

Neuf has 2 finitions:

Neuf
 ├── Simple
 └── Décoratif

Neuf → Simple
SYSTEM

Neuf → Décoratif
SYSTEM


➡️ Same system, only finition changes later if needed.

3️⃣ Extérieur → Monocouche

No extra choice:

Monocouche :
- 1 couche d’impression
- 2 couches de finition

4️⃣ Extérieur → Ancien peinturé

User chooses:

Ancien peinturé
 ├── Avec enduit
 └── Sans enduit

✔️ Avec enduit
SYSTEM

❌ Sans enduit
- 1 couche d’impression
- 2 couches de finition

5️⃣ Extérieur → Placo

No questions:

Placo :
SYSTEM
