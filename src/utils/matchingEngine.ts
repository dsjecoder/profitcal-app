import { ProductNormalizer, NormalizedAttributes } from './productNormalizer';

export type MatchStatus =
  | 'HIGH_CONFIDENCE'
  | 'SUGGESTED'
  | 'REVIEW_REQUIRED'
  | 'MULTIPLE_PLAUSIBLE_SOURCES'
  | 'CONFLICT'
  | 'UNMATCHED';

export interface InvoiceLineInput {
  lineId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineNumber: number;
  rawProductName: string;
  rawSpecification?: string;
  rawUnit?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate?: string;
  sourceFileName?: string;
  normalized?: NormalizedAttributes;
}

export interface DeclarationLineInput {
  lineId: string;
  declarationId: string;
  declarationNumber: string;
  declarationDate: string;
  lineNumber: number;
  hsCode?: string;
  rawDescription: string;
  rawSpecification?: string;
  rawUnit?: string;
  quantity: number;
  invoiceUnitPrice?: number;
  invoiceCurrency?: string;
  invoiceValue?: number;
  taxableUnitPrice?: number;
  taxableValue?: number;
  importTaxAmount?: number;
  vatAmount?: number;
  origin?: string;
  sheetName?: string;
  rowStart?: number;
  sourceFileName?: string;
  normalized?: NormalizedAttributes;
}

export interface MatchCandidateResult {
  candidateId: string;
  invoiceLineId: string;
  declarationId: string;
  declarationLineId: string;
  declarationNumber: string;
  declarationLineNumber: number;
  declarationDescription: string;
  declarationQuantity: number;
  declarationUnit: string;
  declarationImportPrice: number;
  declarationCurrency: string;
  declarationTaxablePrice: number;
  declarationTaxableValue: number;
  declarationVat: number;
  rank: number;
  overallScore: number;
  productIdentityScore: number;
  sourceFeasibilityScore: number;
  status: MatchStatus;
  decomposedScores: Record<string, number>;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  missingEvidence: string[];
  traceability: string;
  matchedDeclarationLine?: DeclarationLineInput;
}

export class MatchingEngine {
  public static DEFAULT_WEIGHTS = {
    category_name: 0.35,
    dimension_spec: 0.30,
    material: 0.15,
    unit: 0.10,
    quantity: 0.10,
  };

  public static THRESHOLD_AUTO = 90.0;
  public static THRESHOLD_SUGGESTED = 75.0;

  public static matchLine(
    invoiceLine: InvoiceLineInput,
    declarationLines: DeclarationLineInput[],
    topK: number = 5,
    customWeights?: Record<string, number>
  ): MatchCandidateResult[] {
    if (!declarationLines || declarationLines.length === 0) {
      return [];
    }

    const w = customWeights || MatchingEngine.DEFAULT_WEIGHTS;
    const invNorm =
      invoiceLine.normalized ||
      ProductNormalizer.normalizeProduct(
        invoiceLine.rawProductName,
        invoiceLine.rawSpecification || '',
        invoiceLine.rawUnit || ''
      );

    const candidates: MatchCandidateResult[] = [];

    for (const declLine of declarationLines) {
      const declNorm =
        declLine.normalized ||
        ProductNormalizer.normalizeProduct(
          declLine.rawDescription,
          declLine.rawSpecification || '',
          declLine.rawUnit || '',
          declLine.hsCode || ''
        );

      // Signal evaluations
      const [nameScore, nameEv] = MatchingEngine.evalNameAndCategory(invNorm, declNorm);
      const [dimScore, dimEv, dimStatus] = MatchingEngine.evalDimensions(invNorm, declNorm);
      const [matScore, matEv, matStatus] = MatchingEngine.evalMaterial(invNorm, declNorm);
      const [unitScore, unitEv, unitStatus] = MatchingEngine.evalUnit(invNorm, declNorm);
      const [qtyScore, qtyEv, qtyStatus] = MatchingEngine.evalQuantity(invoiceLine.quantity, declLine.quantity);
      const [subCompScore, subCompEv] = MatchingEngine.evalSubComponents(invNorm, declNorm);

      let effectiveDimScore = dimScore;
      if (invNorm.canonicalType === 'hardware_bag' && declNorm.canonicalType === 'hardware_bag') {
        effectiveDimScore = subCompScore;
      }

      // Base score (0..100)
      const baseScore =
        (nameScore * w.category_name +
          effectiveDimScore * w.dimension_spec +
          matScore * w.material +
          unitScore * w.unit +
          qtyScore * w.quantity) *
        100.0;

      // Penalties & Contradictions
      const contradictions: string[] = [];
      let penaltyPoints = 0.0;

      if (dimStatus === 'CONFLICT') {
        penaltyPoints += 20.0;
        contradictions.push(
          `Mâu thuẫn kích thước: Hóa đơn (${invNorm.dimensionsNormalized}) vs Tờ khai (${declNorm.dimensionsNormalized})`
        );
      }
      if (matStatus === 'CONFLICT') {
        penaltyPoints += 20.0;
        contradictions.push(
          `Mâu thuẫn vật liệu: Hóa đơn (${invNorm.material}) vs Tờ khai (${declNorm.material})`
        );
      }
      if (unitStatus === 'CONFLICT') {
        penaltyPoints += 15.0;
        contradictions.push(
          `Mâu thuẫn đơn vị tính: Hóa đơn (${invoiceLine.rawUnit}) vs Tờ khai (${declLine.rawUnit})`
        );
      }

      const overallScore = Math.round(Math.max(baseScore - penaltyPoints, 0.0) * 10) / 10;

      // Evidence aggregation
      const supporting: string[] = [
        ...nameEv.supporting,
        ...dimEv.supporting,
        ...matEv.supporting,
        ...unitEv.supporting,
        ...qtyEv.supporting,
        ...subCompEv.supporting,
      ];

      contradictions.push(
        ...nameEv.contradicting,
        ...dimEv.contradicting,
        ...matEv.contradicting,
        ...unitEv.contradicting,
        ...qtyEv.contradicting,
        ...subCompEv.contradicting
      );

      const missing: string[] = [];
      if (!invNorm.dimensionsNormalized && !declNorm.dimensionsNormalized && invNorm.canonicalType !== 'hardware_bag') {
        missing.push('Không có thông tin kích thước quy cách trên cả hai chứng từ');
      } else if (!invNorm.dimensionsNormalized && invNorm.canonicalType !== 'hardware_bag') {
        missing.push('Hóa đơn không ghi rõ kích thước');
      } else if (!declNorm.dimensionsNormalized && declNorm.canonicalType !== 'hardware_bag') {
        missing.push('Tờ khai không ghi rõ kích thước');
      }

      if (invNorm.material === 'unknown' && declNorm.material === 'unknown') {
        missing.push('Không nêu rõ chất liệu cụ thể');
      }

      // Determine Status
      let status: MatchStatus = 'REVIEW_REQUIRED';
      if (overallScore >= MatchingEngine.THRESHOLD_AUTO && contradictions.length === 0) {
        status = 'HIGH_CONFIDENCE';
      } else if (overallScore >= MatchingEngine.THRESHOLD_SUGGESTED && contradictions.length === 0) {
        status = 'SUGGESTED';
      } else if (contradictions.length > 0 && overallScore >= 50.0) {
        status = 'CONFLICT';
      } else if (qtyStatus === 'INSUFFICIENT' && overallScore >= MatchingEngine.THRESHOLD_SUGGESTED) {
        status = 'MULTIPLE_PLAUSIBLE_SOURCES';
      } else if (overallScore < 40.0) {
        status = 'UNMATCHED';
      }

      const prodIdentity = Math.round((nameScore * 0.4 + effectiveDimScore * 0.4 + matScore * 0.2) * 1000) / 10;
      const sourceFeasibility = Math.round((qtyScore * 0.7 + unitScore * 0.3) * 1000) / 10;

      const sheetName = declLine.sheetName || 'TKN';
      const rowStart = declLine.rowStart || 0;
      const traceabilityStr = `Sheet: ${sheetName}, Row: ${rowStart}, Line: ${declLine.lineNumber}`;

      candidates.push({
        candidateId: `${invoiceLine.lineId}_cand_${declLine.lineId}`,
        invoiceLineId: invoiceLine.lineId,
        declarationId: declLine.declarationId,
        declarationLineId: declLine.lineId,
        declarationNumber: declLine.declarationNumber,
        declarationLineNumber: declLine.lineNumber,
        declarationDescription: declLine.rawDescription,
        declarationQuantity: declLine.quantity,
        declarationUnit: declLine.rawUnit || '',
        declarationImportPrice: declLine.invoiceUnitPrice || 0,
        declarationCurrency: declLine.invoiceCurrency || 'USD',
        declarationTaxablePrice: declLine.taxableUnitPrice || 0,
        declarationTaxableValue: declLine.taxableValue || 0,
        declarationVat: declLine.vatAmount || 0,
        rank: 1,
        overallScore,
        productIdentityScore: prodIdentity,
        sourceFeasibilityScore: sourceFeasibility,
        status,
        decomposedScores: {
          nameCategory: Math.round(nameScore * w.category_name * 1000) / 10,
          dimensionSpec: Math.round(effectiveDimScore * w.dimension_spec * 1000) / 10,
          material: Math.round(matScore * w.material * 1000) / 10,
          unit: Math.round(unitScore * w.unit * 1000) / 10,
          quantity: Math.round(qtyScore * w.quantity * 1000) / 10,
          penalty: -penaltyPoints,
          finalScore: overallScore,
        },
        supportingEvidence: Array.from(new Set(supporting)),
        contradictingEvidence: Array.from(new Set(contradictions)),
        missingEvidence: Array.from(new Set(missing)),
        traceability: traceabilityStr,
        matchedDeclarationLine: declLine,
      });
    }

    // Sort descending by score
    candidates.sort((a, b) => b.overallScore - a.overallScore);

    const topCandidates = candidates.slice(0, topK);
    topCandidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    return topCandidates;
  }

  private static evalNameAndCategory(
    inv: NormalizedAttributes,
    decl: NormalizedAttributes
  ): [number, { supporting: string[]; contradicting: string[] }] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };
    let score = 0.0;

    if (inv.canonicalType && decl.canonicalType) {
      if (inv.canonicalType === decl.canonicalType && inv.canonicalType !== 'general_hardware') {
        score += 0.6;
        ev.supporting.push(`Cùng nhóm sản phẩm: ${inv.canonicalType.replace(/_/g, ' ')}`);
      } else if (
        inv.canonicalType !== decl.canonicalType &&
        inv.canonicalType !== 'general_hardware' &&
        decl.canonicalType !== 'general_hardware'
      ) {
        ev.contradicting.push(`Khác nhóm sản phẩm (${inv.canonicalType} vs ${decl.canonicalType})`);
      }
    }

    const invKws = new Set(inv.keywords);
    const declKws = new Set(decl.keywords);
    if (invKws.size > 0 && declKws.size > 0) {
      const overlap = Array.from(invKws).filter((x) => declKws.has(x));
      const union = new Set([...Array.from(invKws), ...Array.from(declKws)]);
      const jaccard = overlap.length / union.size;
      score += jaccard * 0.4;
      if (overlap.length >= 2) {
        ev.supporting.push(`Trùng khớp từ khóa (${overlap.slice(0, 4).join(', ')})`);
      }
    }

    const invPlain = ProductNormalizer.removeVietnameseAccents(inv.rawText.toLowerCase());
    const declPlain = ProductNormalizer.removeVietnameseAccents(decl.rawText.toLowerCase());
    if (invPlain.includes(declPlain) || declPlain.includes(invPlain)) {
      score = Math.max(score, 0.95);
      ev.supporting.push('Tên sản phẩm trùng khớp với mô tả trên tờ khai');
    }

    return [Math.min(Math.max(score, 0.0), 1.0), ev];
  }

  private static evalDimensions(
    inv: NormalizedAttributes,
    decl: NormalizedAttributes
  ): [number, { supporting: string[]; contradicting: string[] }, string] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };

    if (inv.dimensionsNormalized && decl.dimensionsNormalized) {
      if (inv.dimensionsNormalized === decl.dimensionsNormalized) {
        ev.supporting.push(`Kích thước trùng khớp chính xác: ${inv.dimensionsNormalized}`);
        return [1.0, ev, 'EXACT'];
      }

      if (inv.dimensionTuple.length > 0 && decl.dimensionTuple.length > 0) {
        if (JSON.stringify(inv.dimensionTuple) === JSON.stringify(decl.dimensionTuple)) {
          ev.supporting.push(`Kích thước số học trùng khớp: ${inv.dimensionsNormalized}`);
          return [1.0, ev, 'EXACT'];
        }

        const invSet = new Set(inv.dimensionTuple);
        const declSet = new Set(decl.dimensionTuple);
        const isSubset =
          Array.from(invSet).every((x) => declSet.has(x)) || Array.from(declSet).every((x) => invSet.has(x));
        if (isSubset) {
          ev.supporting.push(
            `Kích thước tương đồng một phần: ${inv.dimensionsNormalized} vs ${decl.dimensionsNormalized}`
          );
          return [0.7, ev, 'PARTIAL'];
        }
      }

      ev.contradicting.push(`Sai khác kích thước: ${inv.dimensionsNormalized} vs ${decl.dimensionsNormalized}`);
      return [0.1, ev, 'CONFLICT'];
    }

    if (inv.dimensionsNormalized || decl.dimensionsNormalized) {
      return [0.6, ev, 'UNKNOWN'];
    }

    return [0.8, ev, 'UNKNOWN'];
  }

  private static evalMaterial(
    inv: NormalizedAttributes,
    decl: NormalizedAttributes
  ): [number, { supporting: string[]; contradicting: string[] }, string] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };

    if (inv.material !== 'unknown' && decl.material !== 'unknown') {
      if (inv.material === decl.material) {
        ev.supporting.push(`Cùng chất liệu: ${inv.material.replace(/_/g, ' ')}`);
        return [1.0, ev, 'EXACT'];
      }

      if (
        (inv.material === 'leather' && decl.material === 'pu_leather') ||
        (inv.material === 'pu_leather' && decl.material === 'leather')
      ) {
        ev.contradicting.push('Sai khác vật liệu: Da thật (Leather) vs Da nhân tạo (PU)');
        return [0.1, ev, 'CONFLICT'];
      }

      ev.contradicting.push(`Khác chất liệu: ${inv.material} vs ${decl.material}`);
      return [0.15, ev, 'CONFLICT'];
    }

    if (inv.material !== 'unknown' || decl.material !== 'unknown') {
      const knownMat = inv.material !== 'unknown' ? inv.material : decl.material;
      ev.supporting.push(`Ghi nhận chất liệu (${knownMat})`);
      return [0.8, ev, 'COMPATIBLE'];
    }

    return [0.8, ev, 'UNKNOWN'];
  }

  private static evalUnit(
    inv: NormalizedAttributes,
    decl: NormalizedAttributes
  ): [number, { supporting: string[]; contradicting: string[] }, string] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };

    if (inv.unitCanonical === decl.unitCanonical) {
      ev.supporting.push(`Đơn vị tính tương thích (${inv.unitCanonical})`);
      return [1.0, ev, 'EXACT'];
    }

    const pair = new Set([inv.unitCanonical, decl.unitCanonical]);
    if (
      (pair.has('PCE') && pair.has('UNT')) ||
      (pair.has('SET') && pair.has('KIT')) ||
      (pair.has('PCE') && pair.has('SET'))
    ) {
      ev.supporting.push(`Đơn vị tính có thể chấp nhận (${inv.unitCanonical} ↔ ${decl.unitCanonical})`);
      return [0.85, ev, 'COMPATIBLE'];
    }

    ev.contradicting.push(`Khác đơn vị tính (${inv.unitCanonical} vs ${decl.unitCanonical})`);
    return [0.2, ev, 'CONFLICT'];
  }

  private static evalQuantity(
    invQty: number,
    declQty: number
  ): [number, { supporting: string[]; contradicting: string[] }, string] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };

    if (invQty <= 0 || declQty <= 0) {
      return [0.5, ev, 'UNKNOWN'];
    }

    if (invQty === declQty) {
      ev.supporting.push(`Số lượng khớp hoàn toàn (${Math.round(invQty)})`);
      return [1.0, ev, 'EXACT'];
    }

    if (declQty > invQty) {
      ev.supporting.push(`Tờ khai đủ đáp ứng số lượng (${Math.round(invQty)} / ${Math.round(declQty)})`);
      return [0.85, ev, 'SUFFICIENT'];
    }

    ev.contradicting.push(`Số lượng tờ khai (${Math.round(declQty)}) nhỏ hơn hóa đơn (${Math.round(invQty)})`);
    return [0.4, ev, 'INSUFFICIENT'];
  }

  private static evalSubComponents(
    inv: NormalizedAttributes,
    decl: NormalizedAttributes
  ): [number, { supporting: string[]; contradicting: string[] }] {
    const ev = { supporting: [] as string[], contradicting: [] as string[] };
    if (!inv.subComponents.length || !decl.subComponents.length) {
      return [0.7, ev];
    }

    const invBolts = inv.subComponents.filter((c) => c.name === 'bulong');
    const declBolts = decl.subComponents.filter((c) => c.name === 'bulong');

    let boltMatch = false;
    if (invBolts.length > 0 && declBolts.length > 0) {
      const invSpecs = invBolts.map((b) => b.spec).sort().join(',');
      const declSpecs = declBolts.map((b) => b.spec).sort().join(',');
      if (invSpecs === declSpecs) {
        boltMatch = true;
        ev.supporting.push(`Khớp chính xác thông số Bulong (${invSpecs})`);
      } else {
        ev.contradicting.push('Khác quy cách Bulong trong túi ngũ kim');
      }
    }

    const invTypes = new Set(inv.subComponents.map((c) => c.name));
    const declTypes = new Set(decl.subComponents.map((c) => c.name));
    const overlap = Array.from(invTypes).filter((t) => declTypes.has(t));

    let score = 0.4;
    if (boltMatch) score += 0.4;
    if (overlap.length >= 2) {
      score += 0.2;
      ev.supporting.push(`Trùng khớp các phụ kiện trong túi (${overlap.length} loại)`);
    }

    return [Math.min(Math.max(score, 0.1), 1.0), ev];
  }
}
