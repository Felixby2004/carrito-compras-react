// Datos de ejemplo de departamentos, provincias y distritos de Perú
export const departamentos = [
  { id: '01', nombre: 'Amazonas' },
  { id: '02', nombre: 'Áncash' },
  { id: '03', nombre: 'Apurímac' },
  { id: '04', nombre: 'Arequipa' },
  { id: '05', nombre: 'Ayacucho' },
  { id: '06', nombre: 'Cajamarca' },
  { id: '07', nombre: 'Callao' },
  { id: '08', nombre: 'Cusco' },
  { id: '09', nombre: 'Huancavelica' },
  { id: '10', nombre: 'Huánuco' },
  { id: '11', nombre: 'Ica' },
  { id: '12', nombre: 'Junín' },
  { id: '13', nombre: 'La Libertad' },
  { id: '14', nombre: 'Lambayeque' },
  { id: '15', nombre: 'Lima' },
  { id: '16', nombre: 'Loreto' },
  { id: '17', nombre: 'Madre de Dios' },
  { id: '18', nombre: 'Moquegua' },
  { id: '19', nombre: 'Pasco' },
  { id: '20', nombre: 'Piura' },
  { id: '21', nombre: 'Puno' },
  { id: '22', nombre: 'San Martín' },
  { id: '23', nombre: 'Tacna' },
  { id: '24', nombre: 'Tumbes' },
  { id: '25', nombre: 'Ucayali' }
];

export const provincias: Record<string, { id: string; nombre: string }[]> = {
  '15': [ // Lima
    { id: '1501', nombre: 'Lima' },
    { id: '1502', nombre: 'Barranca' },
    { id: '1503', nombre: 'Cajatambo' },
    { id: '1504', nombre: 'Cañete' },
    { id: '1505', nombre: 'Canta' },
    { id: '1506', nombre: 'Huaral' },
    { id: '1507', nombre: 'Huarochirí' },
    { id: '1508', nombre: 'Huaura' },
    { id: '1509', nombre: 'Oyón' },
    { id: '1510', nombre: 'Yauyos' }
  ],
  '07': [ // Callao
    { id: '0701', nombre: 'Callao' }
  ]
};

export const distritos: Record<string, { id: string; nombre: string }[]> = {
  '1501': [ // Lima
    { id: '150101', nombre: 'Lima' },
    { id: '150102', nombre: 'Ancón' },
    { id: '150103', nombre: 'Ate' },
    { id: '150104', nombre: 'Barranco' },
    { id: '150105', nombre: 'Breña' },
    { id: '150106', nombre: 'Carabayllo' },
    { id: '150107', nombre: 'Chaclacayo' },
    { id: '150108', nombre: 'Chorrillos' },
    { id: '150109', nombre: 'El Agustino' },
    { id: '150110', nombre: 'Independencia' },
    { id: '150111', nombre: 'Jesús María' },
    { id: '150112', nombre: 'La Molina' },
    { id: '150113', nombre: 'La Victoria' },
    { id: '150114', nombre: 'Lince' },
    { id: '150115', nombre: 'Los Olivos' },
    { id: '150116', nombre: 'Lurigancho-Chosica' },
    { id: '150117', nombre: 'Lurín' },
    { id: '150118', nombre: 'Magdalena del Mar' },
    { id: '150119', nombre: 'Miraflores' },
    { id: '150120', nombre: 'Pachacámac' },
    { id: '150121', nombre: 'Pueblo Libre' },
    { id: '150122', nombre: 'Puente Piedra' },
    { id: '150123', nombre: 'Rímac' },
    { id: '150124', nombre: 'San Bartolo' },
    { id: '150125', nombre: 'San Borja' },
    { id: '150126', nombre: 'San Isidro' },
    { id: '150127', nombre: 'San Juan de Lurigancho' },
    { id: '150128', nombre: 'San Juan de Miraflores' },
    { id: '150129', nombre: 'San Luis' },
    { id: '150130', nombre: 'San Martín de Porres' },
    { id: '150131', nombre: 'San Miguel' },
    { id: '150132', nombre: 'Santa Anita' },
    { id: '150133', nombre: 'Santa María del Mar' },
    { id: '150134', nombre: 'Santa Rosa' },
    { id: '150135', nombre: 'Santiago de Surco' },
    { id: '150136', nombre: 'Surquillo' },
    { id: '150137', nombre: 'Villa El Salvador' },
    { id: '150138', nombre: 'Villa María del Triunfo' }
  ]
};
