/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JewelryImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const JEWELRY_IMAGE_PRESETS: JewelryImagePreset[] = [
  {
    id: 'ring-emerald',
    name: 'Anillo Esmeralda Muzo & Oro 18K',
    category: 'Anillos',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ring-solitaire',
    name: 'Solitario Diamante Oro Blanco',
    category: 'Anillos',
    url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'ring-band',
    name: 'Argolla Matrimonio Oro Amarillo',
    category: 'Anillos',
    url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'chain-cuban',
    name: 'Cadena Eslabón Cubano Macizo',
    category: 'Cadenas',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'chain-rope',
    name: 'Cadena Cordón Tejido Fino',
    category: 'Cadenas',
    url: 'https://images.unsplash.com/photo-1611591475870-87779bc9886b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'bracelet-tennis',
    name: 'Pulsera Tennis de Diamantes',
    category: 'Pulseras',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'bracelet-silver',
    name: 'Pulsera Rolo Plata 925 con Dije',
    category: 'Pulseras',
    url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'earrings-emerald',
    name: 'Aretes Colgantes Esmeralda y Brillantes',
    category: 'Aretes',
    url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'earrings-studs',
    name: 'Topos Diamante Solitario',
    category: 'Aretes',
    url: 'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pendant-cross',
    name: 'Dije Cruz Alta Joyería con Gemas',
    category: 'Dijes',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'necklace-pearls',
    name: 'Gargantilla de Perlas Akoya y Oro',
    category: 'Gargantillas',
    url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'gold-bullion',
    name: 'Lingotes de Oro Puro 24K Sellados',
    category: 'Lingotes y Monedas',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxury-watch',
    name: 'Reloj de Lujo Oro y Acero',
    category: 'Relojes de Lujo',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'gemstone-cert',
    name: 'Esmeralda / Gema en Bruto Certificada',
    category: 'Gemas Certificadas',
    url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800&auto=format&fit=crop&q=80',
  },
];

/**
 * Returns a fallback high quality image based on category if product has no imageUrl
 */
export function getDefaultJewelryImage(category: string, name?: string): string {
  const lowerName = (name || '').toLowerCase();
  
  if (lowerName.includes('lingote') || lowerName.includes('moneda')) {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'gold-bullion')!.url;
  }
  if (lowerName.includes('rolex') || lowerName.includes('reloj')) {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'luxury-watch')!.url;
  }
  if (lowerName.includes('esmeralda') && (category === 'Anillos' || lowerName.includes('anillo'))) {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'ring-emerald')!.url;
  }
  if (lowerName.includes('cuban') || lowerName.includes('eslabón') || category === 'Cadenas') {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'chain-cuban')!.url;
  }
  if (lowerName.includes('tennis') || (category === 'Pulseras' && lowerName.includes('diamante'))) {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'bracelet-tennis')!.url;
  }
  if (category === 'Aretes') {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'earrings-emerald')!.url;
  }
  if (category === 'Dijes') {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'pendant-cross')!.url;
  }
  if (category === 'Gargantillas') {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'necklace-pearls')!.url;
  }
  if (category === 'Pulseras') {
    return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'bracelet-silver')!.url;
  }

  // Default to solitaire ring
  return JEWELRY_IMAGE_PRESETS.find((p) => p.id === 'ring-solitaire')!.url;
}
