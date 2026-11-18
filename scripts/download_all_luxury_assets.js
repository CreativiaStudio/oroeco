const fs = require('fs');
const path = require('path');

const ASSETS_TO_DOWNLOAD = [
  // DAVITE & DELUCCHI
  {
    dest: 'public/images/products/davite-delucchi/tennis_diamanti_01.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_diamanti_02.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_diamanti_03.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_zaffiri_01.jpg',
    url: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_zaffiri_02.jpg',
    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_rubini_01.jpg',
    url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/tennis_rubini_02.jpg',
    url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_diamanti_01.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_diamanti_02.jpg',
    url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_diamanti_03.jpg',
    url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_smeraldi_01.jpg',
    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_smeraldi_02.jpg',
    url: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_zaffiri_01.jpg',
    url: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_zaffiri_02.jpg',
    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_rubini_01.jpg',
    url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/veretta_rubini_02.jpg',
    url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/solitario_diamante_01.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/solitario_diamante_02.jpg',
    url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/solitario_diamante_03.jpg',
    url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/trilogy_diamanti_01.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/trilogy_diamanti_02.jpg',
    url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/davite-delucchi/davite_box_certificato.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // NIHAMA (Japanese Akoya Pearls)
  {
    dest: 'public/images/products/nihama/nihama_akoya_strand_01.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/nihama/nihama_akoya_clasp_02.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/nihama/nihama_akoya_luster_03.jpg',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/nihama/nihama_bracciale_01.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/nihama/nihama_bracciale_02.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/nihama/nihama_box_passaporto.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // LOCMAN (Watches)
  {
    dest: 'public/images/products/locman/locman_mare_300mt_01.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_mare_300mt_02.jpg',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_stealth_titanio_01.jpg',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_stealth_titanio_02.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_montecristo_01.jpg',
    url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_montecristo_02.jpg',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_1960_crono_01.jpg',
    url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_1960_crono_02.jpg',
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_1960_lady_01.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_1960_lady_02.jpg',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_stealth_lady_01.jpg',
    url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_stealth_lady_02.jpg',
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/locman/locman_box_garanzia.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // PAUL PICOT (Haute Horlogerie Suisse)
  {
    dest: 'public/images/products/paul-picot/paul_picot_mariner3_01.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_mariner3_02.jpg',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_firshire_moon_01.jpg',
    url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_firshire_moon_02.jpg',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_gentleman_01.jpg',
    url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_gentleman_02.jpg',
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_yachtman_01.jpg',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_yachtman_02.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_classic_01.jpg',
    url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_classic_02.jpg',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/paul-picot/paul_picot_radica_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // LLADRÓ (Fine Porcelain & Lithophane Lighting)
  {
    dest: 'public/images/products/lladro/lladro_lace_dome_01.jpg',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_lace_dome_02.jpg',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_cranes_dome_01.jpg',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_cranes_dome_02.jpg',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_paisley_dome_01.jpg',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_paisley_dome_02.jpg',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_my_little_sweetie_01.jpg',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_my_little_sweetie_02.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_vincolo_damore_01.jpg',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_vincolo_damore_02.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_angelo_celestiale_01.jpg',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_angelo_celestiale_02.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_valencia_art_01.jpg',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_valencia_art_02.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_box_sigillo.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // VILLEROY & BOCH (Porcelain & Crystal)
  {
    dest: 'public/images/products/villeroy/villeroy_toys_delight_01.jpg',
    url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_toys_delight_02.jpg',
    url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_maxima_calici_01.jpg',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_maxima_calici_02.jpg',
    url: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_nek_bleu_01.jpg',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_nek_bleu_02.jpg',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_perle_vaso_01.jpg',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_perle_vaso_02.jpg',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_decanter_01.jpg',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_decanter_02.jpg',
    url: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_posate_01.jpg',
    url: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_posate_02.jpg',
    url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/villeroy/villeroy_gift_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },

  // LUXURY ACCESSORIES & OTHER BRANDS
  {
    dest: 'public/images/products/luxury/guess_watch_01.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/guess_watch_02.jpg',
    url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/alberelli_capodimonte_01.jpg',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/alberelli_capodimonte_02.jpg',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/dana_oro_cerchi_01.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/dana_oro_cerchi_02.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/ducati_corse_crono_01.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/ducati_corse_crono_02.jpg',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/gerba_bracciale_pietre_01.jpg',
    url: 'https://images.unsplash.com/photo-1611591475852-53744927b5e4?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/gerba_bracciale_pietre_02.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/golay_south_sea_01.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/golay_south_sea_02.jpg',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/cammeo_italiano_01.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/cammeo_italiano_02.jpg',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/amen_medaglia_01.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/amen_medaglia_02.jpg',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/luxury_watch_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/luxury_velvet_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/luxury_gift_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/luxury_pouch.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/amen_box.jpg',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85'
  }
];

async function downloadAll() {
  console.log(`=== AVVIO DOWNLOAD ASSET FOTOGRAFICI DI LUSSO (${ASSETS_TO_DOWNLOAD.length} file) ===\n`);
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < ASSETS_TO_DOWNLOAD.length; i++) {
    const item = ASSETS_TO_DOWNLOAD[i];
    const dest = item.dest;

    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`[${i+1}/${ASSETS_TO_DOWNLOAD.length}] ⏩ Già presente: ${dest}`);
      skipped++;
      continue;
    }

    try {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const res = await fetch(item.url);
      if (res.status === 200) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log(`[${i+1}/${ASSETS_TO_DOWNLOAD.length}] ✅ Scaricato: ${dest} (${Math.round(buffer.length/1024)} KB)`);
        success++;
      } else {
        console.error(`[${i+1}/${ASSETS_TO_DOWNLOAD.length}] ❌ Errore HTTP ${res.status}: ${item.url}`);
        failed++;
      }
    } catch (err) {
      console.error(`[${i+1}/${ASSETS_TO_DOWNLOAD.length}] ❌ Errore download ${dest}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== COMPLETATO: ${success} scaricati, ${skipped} saltati (già presenti), ${failed} falliti ===`);
}

downloadAll();
