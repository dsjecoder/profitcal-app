export interface SubComponent {
  name: string;
  spec: string;
  quantity: number;
  unit: string;
}

export interface NormalizedAttributes {
  rawText: string;
  canonicalType: string;
  category: string;
  function: string;
  material: string;
  dimensionsRaw: string;
  dimensionsNormalized: string;
  dimensionTuple: number[];
  unitCanonical: string;
  keywords: string[];
  subComponents: SubComponent[];
  hsCodePrefix: string;
}

export class ProductNormalizer {
  public static MATERIAL_SYNONYMS: Record<string, string[]> = {
    pu_leather: ['pu giả da', 'pu gia da', 'synthetic leather', 'faux leather', 'simili', 'pu'],
    leather: ['da thật', 'genuine leather', 'da', 'leather'],
    iron: ['sắt', 'sat', 'iron', 'steel', 'thép', 'thep', 'kim loại', 'metal'],
    wood: ['gỗ', 'go', 'wood', 'wooden', 'timber'],
    plastic: ['nhựa', 'nhua', 'plastic', 'nilon', 'nylon', 'polymer'],
    alloy: ['hợp kim', 'hop kim', 'alloy', 'nhôm', 'aluminum', 'alu'],
    fabric: ['vải', 'vai', 'fabric', 'textile', 'cotton'],
  };

  public static UNIT_MAPPING: Record<string, string> = {
    cái: 'PCE', cai: 'PCE', chiếc: 'PCE', chiec: 'PCE', c: 'PCE',
    pce: 'PCE', pc: 'PCE', ea: 'PCE', piece: 'PCE', pieces: 'PCE', unt: 'PCE',
    bộ: 'SET', bo: 'SET', set: 'SET', sets: 'SET', kit: 'SET',
    kg: 'KGM', kgm: 'KGM', kilogram: 'KGM', kilos: 'KGM',
    mét: 'MTR', met: 'MTR', mtr: 'MTR', m: 'MTR', meter: 'MTR',
    cặp: 'PAIR', cap: 'PAIR', pr: 'PAIR', pair: 'PAIR',
    hộp: 'BOX', hop: 'BOX', box: 'BOX', thùng: 'CTN', ctn: 'CTN', cuộn: 'ROLL', roll: 'ROLL',
  };

  public static CATEGORY_KEYWORDS: Record<string, string[]> = {
    bed_headboard_frame: ['khung đầu giường', 'khung dau giuong', 'headboard'],
    bed_footboard_frame: ['khung đuôi giường', 'khung duoi giuong', 'footboard'],
    bed_accessories: ['bed accessories', 'bộ phận của giường'],
    chair_backrest_frame: ['khung tựa lưng ghế', 'tựa lưng', 'tua lung', 'backrest', 'chair backrest frame'],
    chair_leg: ['chân ghế', 'chan ghe', 'chair leg', 'tháo rời', 'thao roi'],
    chair_mechanism: ['mâm ghế', 'mam ghe', 'chair part', 'nâng hạ', 'nang ha'],
    iron_bar: ['thanh nối', 'thanh noi', 'iron bar', 'nối bằng sắt'],
    gas_spring: ['ti điều chỉnh', 'ti dieu chinh', 'gas spring', 'độ cao thấp', 'piston'],
    chair_seat_frame: ['khung mặt ngồi', 'mat ngoi', 'chair frame accessories', 'seat frame'],
    chair_cover: ['vỏ bọc ghế', 'vo boc ghe', 'chair cover', 'vỏ bọc'],
    socket: ['ổ cắm điện', 'o cam dien', 'socket', 'cắm điện', 'ổ cắm'],
    foot_pad: ['miếng đệm chân đế', 'mieng dem', 'chân đế', 'chan de', 'foot pad'],
    hardware_bag: ['túi ngũ kim', 'tui ngu kim', 'hardware bag', 'ngũ kim'],
    screw: ['ốc vít', 'oc vit', 'bu lông', 'bulong', 'vít', 'vit', 'screw'],
  };

  public static normalizeText(text: string): string {
    if (!text) return '';
    let res = String(text).toLowerCase().trim();
    res = res.replace(/[\t\r\n]+/g, ' ');
    res = res.replace(/[\*x×]+/g, '*');
    res = res.replace(/\s+/g, ' ');
    return res;
  }

  public static removeVietnameseAccents(str: string): string {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  public static extractDimensions(text: string): {
    dimensionsNormalized: string;
    dimensionTuple: number[];
    dimensionsRaw: string;
  } {
    if (!text) return { dimensionsNormalized: '', dimensionTuple: [], dimensionsRaw: '' };

    const lower = String(text).toLowerCase();
    if (lower.includes('túi ngũ kim') || lower.includes('hardware bag')) {
      return { dimensionsNormalized: '', dimensionTuple: [], dimensionsRaw: '' };
    }

    // 1. 3D / 2D dimensions in parentheses or plain: (1420*1130*60)mm or 440*540*430
    const dim3dMatch = text.match(/\(?(\d+(?:\.\d+)?)\s*[\*x×]\s*(\d+(?:\.\d+)?)\s*[\*x×]\s*(\d+(?:\.\d+)?)\)?\s*(?:mm|cm|m)?/i);
    if (dim3dMatch && dim3dMatch[1] && dim3dMatch[2] && dim3dMatch[3]) {
      const d1 = parseFloat(dim3dMatch[1]);
      const d2 = parseFloat(dim3dMatch[2]);
      const d3 = parseFloat(dim3dMatch[3]);
      const rawS = dim3dMatch[0];
      const normS = `${Number.isInteger(d1) ? d1 : d1}x${Number.isInteger(d2) ? d2 : d2}x${Number.isInteger(d3) ? d3 : d3}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2, d3], dimensionsRaw: rawS };
    }

    // 2. Diameter + length: (fi 50*265)mm, Φ50*265, Ø50×265, D50×265, fi13*3.0Tmm
    const fiMatch = text.match(/\(?(?:fi|phi|Ø|Φ|[Dd])\s*(\d+(?:[\.,]\d+)?)\s*[\*x×]\s*(\d+(?:[\.,]\d+)?)(?:T)?\)?\s*(?:mm)?/i);
    if (fiMatch && fiMatch[1] && fiMatch[2]) {
      const d1 = parseFloat(String(fiMatch[1]).replace(',', '.'));
      const d2 = parseFloat(String(fiMatch[2]).replace(',', '.'));
      const rawS = fiMatch[0];
      const normS = `fi${Number.isInteger(d1) ? d1 : d1}x${Number.isInteger(d2) ? d2 : d2}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2], dimensionsRaw: rawS };
    }

    // 3. Metric screw: M8*40mm or M6*12 or 18*18*9.0*M6
    const mScrew4d = text.match(/\(?(\d+(?:[\.,]\d+)?)\s*[\*x×]\s*(\d+(?:[\.,]\d+)?)\s*[\*x×]\s*(\d+(?:[\.,]\d+)?)\s*[\*x×]\s*M(\d+)\)?\s*(?:mm)?/i);
    if (mScrew4d && mScrew4d[1] && mScrew4d[2] && mScrew4d[3] && mScrew4d[4]) {
      const d1 = parseFloat(String(mScrew4d[1]).replace(',', '.'));
      const d2 = parseFloat(String(mScrew4d[2]).replace(',', '.'));
      const d3 = parseFloat(String(mScrew4d[3]).replace(',', '.'));
      const d4 = parseFloat(String(mScrew4d[4]).replace(',', '.'));
      const rawS = mScrew4d[0];
      const normS = `${Number.isInteger(d1) ? d1 : d1}x${Number.isInteger(d2) ? d2 : d2}x${Number.isInteger(d3) ? d3 : d3}xM${Math.round(d4)}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2, d3, d4], dimensionsRaw: rawS };
    }

    const mScrew = text.match(/\(?M(\d+)\s*[\*x×]\s*(\d+(?:[\.,]\d+)?)\)?\s*(?:mm)?/i);
    if (mScrew && mScrew[1] && mScrew[2]) {
      const d1 = parseFloat(String(mScrew[1]).replace(',', '.'));
      const d2 = parseFloat(String(mScrew[2]).replace(',', '.'));
      const rawS = mScrew[0];
      const normS = `M${Math.round(d1)}x${Number.isInteger(d2) ? d2 : d2}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2], dimensionsRaw: rawS };
    }

    // 4. Thickness + Dimensions: (3T*20*420)mm
    const tMatch = text.match(/\(?(\d+(?:\.\d+)?)T\s*[\*x×]\s*(\d+(?:\.\d+)?)\s*[\*x×]\s*(\d+(?:\.\d+)?)\)?\s*(?:mm)?/i);
    if (tMatch && tMatch[1] && tMatch[2] && tMatch[3]) {
      const d1 = parseFloat(tMatch[1]);
      const d2 = parseFloat(tMatch[2]);
      const d3 = parseFloat(tMatch[3]);
      const rawS = tMatch[0];
      const normS = `${Number.isInteger(d1) ? d1 : d1}Tx${Number.isInteger(d2) ? d2 : d2}x${Number.isInteger(d3) ? d3 : d3}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2, d3], dimensionsRaw: rawS };
    }

    // 5. 2D dimensions: (340*170)mm or (6*18)mm
    const dimScrew25 = text.match(/\(?(\d+)\s*[\*x×]\s*(\d+)\s*[\*x×]\s*M(\d+)\)?\s*(?:mm)?/i);
    if (dimScrew25 && dimScrew25[1] && dimScrew25[2] && dimScrew25[3]) {
      const d1 = parseFloat(dimScrew25[1]);
      const d2 = parseFloat(dimScrew25[2]);
      const d3 = parseFloat(dimScrew25[3]);
      const rawS = dimScrew25[0];
      const normS = `${d1}x${d2}xM${d3}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2, d3], dimensionsRaw: rawS };
    }

    const dim2dMatch = text.match(/\(?(\d+(?:\.\d+)?)\s*[\*x×]\s*(\d+(?:\.\d+)?)\)?\s*(?:mm|cm|m)?/i);
    if (dim2dMatch && dim2dMatch[1] && dim2dMatch[2]) {
      const d1 = parseFloat(dim2dMatch[1]);
      const d2 = parseFloat(dim2dMatch[2]);
      const rawS = dim2dMatch[0];
      const normS = `${Number.isInteger(d1) ? d1 : d1}x${Number.isInteger(d2) ? d2 : d2}`;
      return { dimensionsNormalized: normS, dimensionTuple: [d1, d2], dimensionsRaw: rawS };
    }

    return { dimensionsNormalized: '', dimensionTuple: [], dimensionsRaw: '' };
  }

  public static extractMaterial(text: string): string {
    const lower = ProductNormalizer.normalizeText(text);
    for (const [matKey, syns] of Object.entries(ProductNormalizer.MATERIAL_SYNONYMS)) {
      for (const syn of syns) {
        if (lower.includes(syn)) {
          return matKey;
        }
      }
    }
    return 'unknown';
  }

  public static normalizeUnit(unitStr: string): string {
    if (!unitStr) return 'PCE';
    const u = String(unitStr).toLowerCase().trim();
    return ProductNormalizer.UNIT_MAPPING[u] || u.toUpperCase();
  }

  public static extractCategory(text: string): string {
    const lower = ProductNormalizer.normalizeText(text);
    for (const [catKey, kws] of Object.entries(ProductNormalizer.CATEGORY_KEYWORDS)) {
      for (const kw of kws) {
        if (lower.includes(kw)) {
          return catKey;
        }
      }
    }
    return 'general_hardware';
  }

  public static extractHardwareBagComponents(text: string): SubComponent[] {
    const subItems: SubComponent[] = [];
    const lower = String(text || '').toLowerCase();
    if (!lower.includes('túi ngũ kim') && !lower.includes('hardware bag') && !lower.includes('ngũ kim')) {
      return subItems;
    }

    // 1. Bolts
    const boltRegex = /(\d+)\s*(?:c|chiếc)?\s*(?:bulong|bu lông)?\s*\(?([M\d][\d\.\*x×T]+(?:mm)?)\)?/gi;
    let match;
    while ((match = boltRegex.exec(text)) !== null) {
      const count = parseFloat(match[1]);
      const spec = match[2] ? String(match[2]).replace(/[\*x×]+/g, '*').toLowerCase().replace('mm', '').trim() : '';
      subItems.push({ name: 'bulong', spec, quantity: count, unit: 'c' });
    }

    // 2. Long đền (washers)
    if (lower.includes('long đền') || lower.includes('long den')) {
      subItems.push({ name: 'long_den', spec: 'washers', quantity: 1, unit: 'set' });
    }

    // 3. Khóa LG
    const keyRegex = /(\d+)?\s*(?:c|chiếc)?\s*khóa LG\s*\(?([\d\.\*x×]+(?:mm)?)?\)?/gi;
    while ((match = keyRegex.exec(text)) !== null) {
      const count = match[1] ? parseFloat(match[1]) : 1;
      const spec = match[2] ? match[2].trim() : 'standard';
      subItems.push({ name: 'khoa_lg', spec, quantity: count, unit: 'c' });
    }

    // 4. Accessories
    if (lower.includes('hộp đựng') || lower.includes('hop dung')) {
      subItems.push({ name: 'hop_dung', spec: 'hardware_box', quantity: 1, unit: 'c' });
    }
    if (lower.includes('sách hướng dẫn') || lower.includes('sach huong dan')) {
      subItems.push({ name: 'sach_huong_dan', spec: 'manual', quantity: 1, unit: 'c' });
    }
    if (lower.includes('vỉ nhựa') || lower.includes('vi nhua')) {
      subItems.push({ name: 'vi_nhua', spec: 'plastic_tray', quantity: 1, unit: 'c' });
    }
    if (lower.includes('nút nhựa') || lower.includes('nut nhua')) {
      subItems.push({ name: 'nut_nhua', spec: 'plastic_plug', quantity: 4, unit: 'c' });
    }
    if (lower.includes('ốc liên kết') || lower.includes('oc lien ket')) {
      subItems.push({ name: 'oc_lien_ket', spec: 'connect_screw', quantity: 8, unit: 'c' });
    }

    return subItems;
  }

  public static extractKeywords(text: string): string[] {
    const cleaned = String(text || '').replace(/[\(\)\[\]\,\.\-\:\*\/\d\+]+/g, ' ');
    const words = cleaned.toLowerCase().split(/\s+/);
    const stopwords = new Set([
      'bằng', 'của', 'và', 'có', 'cho', 'được', 'hàng', 'mới', 'trên', 'co', 'stt', 'part', 'dành', 'linh', 'kiện',
    ]);
    const keywords = words.filter((w) => w.length > 1 && !stopwords.has(w));
    return Array.from(new Set(keywords));
  }

  public static normalizeProduct(
    rawName: string,
    rawSpec: string = '',
    rawUnit: string = '',
    hsCode: string = ''
  ): NormalizedAttributes {
    const fullText = `${rawName || ''} ${rawSpec || ''}`.trim();
    const { dimensionsNormalized, dimensionTuple, dimensionsRaw } = ProductNormalizer.extractDimensions(fullText);
    const mat = ProductNormalizer.extractMaterial(fullText);
    const cat = ProductNormalizer.extractCategory(fullText);
    const unitCan = ProductNormalizer.normalizeUnit(rawUnit);
    const subComps = ProductNormalizer.extractHardwareBagComponents(fullText);
    const kws = ProductNormalizer.extractKeywords(fullText);
    const hsPrefix = hsCode && hsCode.length >= 4 ? hsCode.substring(0, 4) : '';

    return {
      rawText: fullText,
      canonicalType: cat,
      category: cat,
      function: '',
      material: mat,
      dimensionsRaw,
      dimensionsNormalized,
      dimensionTuple,
      unitCanonical: unitCan,
      keywords: kws,
      subComponents: subComps,
      hsCodePrefix: hsPrefix,
    };
  }
}
