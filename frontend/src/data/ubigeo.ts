// Datos de departamentos, provincias y distritos de Perú
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
  '01': [ // Amazonas
    { id: '0101', nombre: 'Chachapoyas' },
    { id: '0102', nombre: 'Bagua' },
    { id: '0103', nombre: 'Bongará' },
    { id: '0104', nombre: 'Condorcanqui' },
    { id: '0105', nombre: 'Luya' },
    { id: '0106', nombre: 'Rodríguez de Mendoza' },
    { id: '0107', nombre: 'Utcubamba' }
  ],
  '02': [ // Áncash
    { id: '0201', nombre: 'Huaraz' },
    { id: '0202', nombre: 'Santa' },
    { id: '0203', nombre: 'Casma' },
    { id: '0204', nombre: 'Huarmey' },
    { id: '0205', nombre: 'Carhuaz' }
  ],
  '03': [ // Apurímac
    { id: '0301', nombre: 'Abancay' },
    { id: '0302', nombre: 'Andahuaylas' },
    { id: '0303', nombre: 'Chincheros' }
  ],
  '04': [ // Arequipa
    { id: '0401', nombre: 'Arequipa' },
    { id: '0402', nombre: 'Camaná' },
    { id: '0403', nombre: 'Caravelí' },
    { id: '0404', nombre: 'Castilla' },
    { id: '0405', nombre: 'Caylloma' },
    { id: '0406', nombre: 'Islay' }
  ],
  '05': [ // Ayacucho
    { id: '0501', nombre: 'Huamanga' },
    { id: '0502', nombre: 'Huanta' },
    { id: '0503', nombre: 'Lucanas' }
  ],
  '06': [ // Cajamarca
    { id: '0601', nombre: 'Cajamarca' },
    { id: '0602', nombre: 'Jaén' },
    { id: '0603', nombre: 'Chota' },
    { id: '0604', nombre: 'Cutervo' },
    { id: '0605', nombre: 'San Ignacio' }
  ],
  '07': [ // Callao
    { id: '0701', nombre: 'Callao' }
  ],
  '08': [ // Cusco
    { id: '0801', nombre: 'Cusco' },
    { id: '0802', nombre: 'Calca' },
    { id: '0803', nombre: 'Canchis' },
    { id: '0804', nombre: 'La Convención' },
    { id: '0805', nombre: 'Urubamba' },
    { id: '0806', nombre: 'Espinar' }
  ],
  '09': [ // Huancavelica
    { id: '0901', nombre: 'Huancavelica' },
    { id: '0902', nombre: 'Tayacaja' },
    { id: '0903', nombre: 'Angaraes' }
  ],
  '10': [ // Huánuco
    { id: '1001', nombre: 'Huánuco' },
    { id: '1002', nombre: 'Leoncio Prado' },
    { id: '1003', nombre: 'Ambo' }
  ],
  '11': [ // Ica
    { id: '1101', nombre: 'Ica' },
    { id: '1102', nombre: 'Chincha' },
    { id: '1103', nombre: 'Nasca' },
    { id: '1104', nombre: 'Pisco' },
    { id: '1105', nombre: 'Palpa' }
  ],
  '12': [ // Junín
    { id: '1201', nombre: 'Huancayo' },
    { id: '1202', nombre: 'Chanchamayo' },
    { id: '1203', nombre: 'Jauja' },
    { id: '1204', nombre: 'Tarma' },
    { id: '1205', nombre: 'Yauli' },
    { id: '1206', nombre: 'Satipo' }
  ],
  '13': [ // La Libertad
    { id: '1301', nombre: 'Trujillo' },
    { id: '1302', nombre: 'Ascope' },
    { id: '1303', nombre: 'Chepén' },
    { id: '1304', nombre: 'Pacasmayo' },
    { id: '1305', nombre: 'Sánchez Carrión' },
    { id: '1306', nombre: 'Virú' }
  ],
  '14': [ // Lambayeque
    { id: '1401', nombre: 'Chiclayo' },
    { id: '1402', nombre: 'Ferreñafe' },
    { id: '1403', nombre: 'Lambayeque' }
  ],
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
  '16': [ // Loreto
    { id: '1601', nombre: 'Maynas' },
    { id: '1602', nombre: 'Alto Amazonas' },
    { id: '1603', nombre: 'Loreto' },
    { id: '1604', nombre: 'Mariscal Ramón Castilla' },
    { id: '1605', nombre: 'Requena' },
    { id: '1606', nombre: 'Ucayali' },
    { id: '1607', nombre: 'Datem del Marañón' },
    { id: '1608', nombre: 'Putumayo' }
  ],
  '17': [ // Madre de Dios
    { id: '1701', nombre: 'Tambopata' },
    { id: '1702', nombre: 'Manu' },
    { id: '1703', nombre: 'Tahuamanu' }
  ],
  '18': [ // Moquegua
    { id: '1801', nombre: 'Mariscal Nieto' },
    { id: '1802', nombre: 'General Sánchez Cerro' },
    { id: '1803', nombre: 'Ilo' }
  ],
  '19': [ // Pasco
    { id: '1901', nombre: 'Pasco' },
    { id: '1902', nombre: 'Daniel Alcides Carrión' },
    { id: '1903', nombre: 'Oxapampa' }
  ],
  '20': [ // Piura
    { id: '2001', nombre: 'Piura' },
    { id: '2002', nombre: 'Ayabaca' },
    { id: '2003', nombre: 'Huancabamba' },
    { id: '2004', nombre: 'Morropón' },
    { id: '2005', nombre: 'Paita' },
    { id: '2006', nombre: 'Sullana' },
    { id: '2007', nombre: 'Talara' },
    { id: '2008', nombre: 'Sechura' }
  ],
  '21': [ // Puno
    { id: '2101', nombre: 'Puno' },
    { id: '2102', nombre: 'Azángaro' },
    { id: '2103', nombre: 'Carabaya' },
    { id: '2104', nombre: 'Chucuito' },
    { id: '2105', nombre: 'El Collao' },
    { id: '2106', nombre: 'Huancané' },
    { id: '2107', nombre: 'Lampa' },
    { id: '2108', nombre: 'Melgar' },
    { id: '2109', nombre: 'Moho' },
    { id: '2110', nombre: 'San Antonio de Putina' },
    { id: '2111', nombre: 'San Román' },
    { id: '2112', nombre: 'Sandia' },
    { id: '2113', nombre: 'Yunguyo' }
  ],
  '22': [ // San Martín
    { id: '2201', nombre: 'Moyobamba' },
    { id: '2202', nombre: 'Bellavista' },
    { id: '2203', nombre: 'El Dorado' },
    { id: '2204', nombre: 'Huallaga' },
    { id: '2205', nombre: 'Lamas' },
    { id: '2206', nombre: 'Mariscal Cáceres' },
    { id: '2207', nombre: 'Picota' },
    { id: '2208', nombre: 'Rioja' },
    { id: '2209', nombre: 'San Martín' },
    { id: '2210', nombre: 'Tocache' }
  ],
  '23': [ // Tacna
    { id: '2301', nombre: 'Tacna' },
    { id: '2302', nombre: 'Candarave' },
    { id: '2303', nombre: 'Jorge Basadre' },
    { id: '2304', nombre: 'Tarata' }
  ],
  '24': [ // Tumbes
    { id: '2401', nombre: 'Tumbes' },
    { id: '2402', nombre: 'Contralmirante Villar' },
    { id: '2403', nombre: 'Zarumilla' }
  ],
  '25': [ // Ucayali
    { id: '2501', nombre: 'Coronel Portillo' },
    { id: '2502', nombre: 'Atalaya' },
    { id: '2503', nombre: 'Padre Abad' },
    { id: '2504', nombre: 'Purús' }
  ]
};

export const distritos: Record<string, { id: string; nombre: string }[]> = {
  // Callao
  '0701': [
    { id: '070101', nombre: 'Callao' },
    { id: '070102', nombre: 'Bellavista' },
    { id: '070103', nombre: 'Carmen de la Legua' },
    { id: '070104', nombre: 'La Perla' },
    { id: '070105', nombre: 'La Punta' },
    { id: '070106', nombre: 'Ventanilla' },
    { id: '070107', nombre: 'Mi Perú' }
  ],
  // Lima
  '1501': [
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
  ],
  // Loreto - Maynas
  '1601': [
    { id: '160101', nombre: 'Iquitos' },
    { id: '160102', nombre: 'Punchana' },
    { id: '160103', nombre: 'Belén' },
    { id: '160104', nombre: 'San Juan Bautista' },
    { id: '160105', nombre: 'Fernando Lores' },
    { id: '160106', nombre: 'Indiana' },
    { id: '160107', nombre: 'Las Amazonas' },
    { id: '160108', nombre: 'Mazan' }
  ],
  '1602': [
    { id: '160201', nombre: 'Yurimaguas' },
    { id: '160202', nombre: 'Balsapuerto' }
  ],
  '1603': [
    { id: '160301', nombre: 'Nauta' },
    { id: '160302', nombre: 'Parinari' }
  ],
  // Arequipa - Arequipa
  '0401': [
    { id: '040101', nombre: 'Arequipa' },
    { id: '040102', nombre: 'Alto Selva Alegre' },
    { id: '040103', nombre: 'Cayma' },
    { id: '040104', nombre: 'Cerro Colorado' },
    { id: '040105', nombre: 'Characato' },
    { id: '040106', nombre: 'Jacobo Hunter' },
    { id: '040107', nombre: 'José Luis Bustamante y Rivero' },
    { id: '040108', nombre: 'Mariano Melgar' },
    { id: '040109', nombre: 'Miraflores' },
    { id: '040110', nombre: 'Paucarpata' },
    { id: '040111', nombre: 'Sachaca' },
    { id: '040112', nombre: 'Socabaya' },
    { id: '040113', nombre: 'Yanahuara' }
  ],
  // Cusco - Cusco
  '0801': [
    { id: '080101', nombre: 'Cusco' },
    { id: '080102', nombre: 'Ccorca' },
    { id: '080103', nombre: 'Poroy' },
    { id: '080104', nombre: 'San Jerónimo' },
    { id: '080105', nombre: 'San Sebastián' },
    { id: '080106', nombre: 'Santiago' },
    { id: '080107', nombre: 'Saylla' },
    { id: '080108', nombre: 'Wanchaq' }
  ],
  // La Libertad - Trujillo
  '1301': [
    { id: '130101', nombre: 'Trujillo' },
    { id: '130102', nombre: 'El Porvenir' },
    { id: '130103', nombre: 'Florencia de Mora' },
    { id: '130104', nombre: 'Huanchaco' },
    { id: '130105', nombre: 'La Esperanza' },
    { id: '130106', nombre: 'Laredo' },
    { id: '130107', nombre: 'Moche' },
    { id: '130108', nombre: 'Salaverry' },
    { id: '130109', nombre: 'Simbal' },
    { id: '130110', nombre: 'Víctor Larco Herrera' }
  ],
  // Piura - Piura
  '2001': [
    { id: '200101', nombre: 'Piura' },
    { id: '200102', nombre: 'Castilla' },
    { id: '200103', nombre: 'Catacaos' },
    { id: '200104', nombre: 'Cura Mori' },
    { id: '200105', nombre: 'El Taller' },
    { id: '200106', nombre: 'La Arena' },
    { id: '200107', nombre: 'La Unión' },
    { id: '200108', nombre: 'Las Lomas' },
    { id: '200109', nombre: 'Tambo Grande' },
    { id: '200110', nombre: 'Veintiséis de Octubre' }
  ],
  // Lambayeque - Chiclayo
  '1401': [
    { id: '140101', nombre: 'Chiclayo' },
    { id: '140102', nombre: 'Chongoyape' },
    { id: '140103', nombre: 'Eten' },
    { id: '140104', nombre: 'Eten Puerto' },
    { id: '140105', nombre: 'José Leonardo Ortiz' },
    { id: '140106', nombre: 'La Victoria' },
    { id: '140107', nombre: 'Lagunas' },
    { id: '140108', nombre: 'Monsefú' },
    { id: '140109', nombre: 'Nueva Arica' },
    { id: '140110', nombre: 'Oyotún' },
    { id: '140111', nombre: 'Pátapo' },
    { id: '140112', nombre: 'Picsi' },
    { id: '140113', nombre: 'Pimentel' },
    { id: '140114', nombre: 'Reque' },
    { id: '140115', nombre: 'Santa Rosa' },
    { id: '140116', nombre: 'Saña' },
    { id: '140117', nombre: 'Tuman' }
  ],
  // Junín - Huancayo
  '1201': [
    { id: '120101', nombre: 'Huancayo' },
    { id: '120102', nombre: 'Carhuacallanga' },
    { id: '120103', nombre: 'Chacapampa' },
    { id: '120104', nombre: 'Chicche' },
    { id: '120105', nombre: 'Chilca' },
    { id: '120106', nombre: 'Chongos Alto' },
    { id: '120107', nombre: 'Chupuro' },
    { id: '120108', nombre: 'Colca' },
    { id: '120109', nombre: 'Cullhuas' },
    { id: '120110', nombre: 'El Tambo' },
    { id: '120111', nombre: 'Huacrapuquio' },
    { id: '120112', nombre: 'Hualhuas' },
    { id: '120113', nombre: 'Huancán' },
    { id: '120114', nombre: 'Huasicancha' },
    { id: '120115', nombre: 'Huayucachi' },
    { id: '120116', nombre: 'Ingenio' },
    { id: '120117', nombre: 'Pariahuanca' },
    { id: '120118', nombre: 'Pilcomayo' },
    { id: '120119', nombre: 'Pucará' },
    { id: '120120', nombre: 'Quichuay' },
    { id: '120121', nombre: 'Quilcas' },
    { id: '120122', nombre: 'San Agustín' },
    { id: '120123', nombre: 'San Jerónimo de Tunan' },
    { id: '120124', nombre: 'Saño' },
    { id: '120125', nombre: 'Sapallanga' },
    { id: '120126', nombre: 'Sicaya' },
    { id: '120127', nombre: 'Santo Domingo de Acobamba' },
    { id: '120128', nombre: 'Viques' }
  ],
  // Ica - Ica
  '1101': [
    { id: '110101', nombre: 'Ica' },
    { id: '110102', nombre: 'La Tinguiña' },
    { id: '110103', nombre: 'Los Aquijes' },
    { id: '110104', nombre: 'Ocucaje' },
    { id: '110105', nombre: 'Pachacútec' },
    { id: '110106', nombre: 'Parcona' },
    { id: '110107', nombre: 'Pueblo Nuevo' },
    { id: '110108', nombre: 'Salas' },
    { id: '110109', nombre: 'San José de Los Molinos' },
    { id: '110110', nombre: 'San Juan Bautista' },
    { id: '110111', nombre: 'Santiago' },
    { id: '110112', nombre: 'Subtanjalla' },
    { id: '110113', nombre: 'Tate' },
    { id: '110114', nombre: 'Yauca del Rosario' }
  ],
  // Áncash - Santa & Huaraz
  '0201': [
    { id: '020101', nombre: 'Huaraz' },
    { id: '020102', nombre: 'Independencia' }
  ],
  '0202': [
    { id: '020201', nombre: 'Chimbote' },
    { id: '020202', nombre: 'Nuevo Chimbote' },
    { id: '020203', nombre: 'Coishco' }
  ],
  // San Martín - San Martín & Moyobamba
  '2201': [
    { id: '220101', nombre: 'Moyobamba' }
  ],
  '2209': [
    { id: '220901', nombre: 'Tarapoto' },
    { id: '220902', nombre: 'Morales' },
    { id: '220903', nombre: 'Banda de Shilcayo' }
  ],
  // Tacna - Tacna
  '2301': [
    { id: '230101', nombre: 'Tacna' },
    { id: '230102', nombre: 'Alto de la Alianza' },
    { id: '230103', nombre: 'Calana' },
    { id: '230104', nombre: 'Ciudad Nueva' },
    { id: '230105', nombre: 'Gregorio Albarracín Lanchipa' },
    { id: '230106', nombre: 'Pocollay' }
  ],
  // Puno - Puno & San Román
  '2101': [
    { id: '210101', nombre: 'Puno' }
  ],
  '2111': [
    { id: '211101', nombre: 'Juliaca' }
  ],
  // Ucayali - Coronel Portillo
  '2501': [
    { id: '250101', nombre: 'Pucallpa' },
    { id: '250102', nombre: 'Callería' },
    { id: '250103', nombre: 'Yarinacocha' },
    { id: '250104', nombre: 'Manantay' }
  ]
};
