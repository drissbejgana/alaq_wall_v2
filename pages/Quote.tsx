import React, { useState, useMemo, useEffect } from 'react';

export default function Quote(){

  const [projet,setTypeProjet]=useState('Batiment');
  const [zone,setZone]=useState('interieur')
  const [plafond,setPlafond] = useState('Placo')
//   const 

const object = {
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


return (

    <div>
        <h1>type de projet{object.project_type}</h1>
        <h1>La zone {object.zone}</h1>
    </div>
)

//  ├── Placo
//  ├── Enduit ciment
//  ├── Ancien peinturé
//  └── Plâtre projeté


}