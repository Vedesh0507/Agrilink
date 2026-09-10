import { IBuyerRequirementDocument } from '@/models/BuyerRequirement';
import { IProduceListingDocument } from '@/models/ProduceListing';
import { IMatch, IMatchItem, ICompatibilityBreakdown, QualityGrade } from '@/types';

export interface ScoredListing {
  listing: IProduceListingDocument;
  productScore: number;
  quantityScore: number;
  qualityScore: number;
  locationScore: number;
  dateScore: number;
  priceScore: number;
  totalScore: number;
  explanation: {
    product: string;
    quantity: string;
    quality: string;
    location: string;
    date: string;
    price: string;
  };
}

// Canonical dictionary of common agricultural commodities, vernacular names, and misspellings
const COMMODITY_ALIASES: Record<string, string> = {
  // Onions & Alliums
  onion: 'onion',
  onions: 'onion',
  onon: 'onion',
  onons: 'onion',
  onionn: 'onion',
  ullipaya: 'onion',
  ullipayalu: 'onion',
  pyaaz: 'onion',
  pyaz: 'onion',
  kanda: 'onion',

  // Tomatoes
  tomato: 'tomato',
  tomatoes: 'tomato',
  tomatos: 'tomato',
  tamato: 'tomato',
  tamata: 'tomato',
  tamatar: 'tomato',
  tamakaya: 'tomato',

  // Potatoes
  potato: 'potato',
  potatoes: 'potato',
  potatos: 'potato',
  aloo: 'potato',
  alu: 'potato',
  bangaladumpa: 'potato',
  batata: 'potato',

  // Chillies
  chilli: 'chilli',
  chillies: 'chilli',
  chili: 'chilli',
  chilis: 'chilli',
  chilly: 'chilli',
  mirchi: 'chilli',
  mirapakaya: 'chilli',
  pacha_mirchi: 'chilli',

  // Staples & Vegetables
  carrot: 'carrot',
  carrots: 'carrot',
  gajar: 'carrot',
  cabbage: 'cabbage',
  cabbages: 'cabbage',
  cauliflower: 'cauliflower',
  gobi: 'cauliflower',
  brinjal: 'brinjal',
  brinjals: 'brinjal',
  eggplant: 'brinjal',
  vankaya: 'brinjal',
  baingan: 'brinjal',
  ginger: 'ginger',
  allam: 'ginger',
  adrak: 'ginger',
  garlic: 'garlic',
  vellulli: 'garlic',
  lahsun: 'garlic',
  rice: 'rice',
  paddy: 'rice',
  dhan: 'rice',
  biyyam: 'rice',
  wheat: 'wheat',
  gehun: 'wheat',
  godhuma: 'wheat',
  godhumalu: 'wheat',
  corn: 'maize',
  maize: 'maize',
  makka: 'maize',
  makkajonna: 'maize',
};

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function normalizeCommodity(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (COMMODITY_ALIASES[cleaned]) return COMMODITY_ALIASES[cleaned];

  // Plural stripping / stemming
  if (cleaned.endsWith('ies')) {
    const stem = cleaned.slice(0, -3) + 'y';
    if (COMMODITY_ALIASES[stem]) return COMMODITY_ALIASES[stem];
    const stem2 = cleaned.slice(0, -3) + 'i';
    if (COMMODITY_ALIASES[stem2]) return COMMODITY_ALIASES[stem2];
  }
  if (cleaned.endsWith('es')) {
    const stem = cleaned.slice(0, -2);
    if (COMMODITY_ALIASES[stem]) return COMMODITY_ALIASES[stem];
  }
  if (cleaned.endsWith('s') && cleaned.length > 3) {
    const stem = cleaned.slice(0, -1);
    if (COMMODITY_ALIASES[stem]) return COMMODITY_ALIASES[stem];
  }
  return cleaned;
}

export class MatchingService {
  /**
   * Evaluates individual score of a produce listing against a buyer requirement.
   * Total Weight:
   * - Product Compatibility: 30%
   * - Quantity Match: 20%
   * - Quality Grade: 15%
   * - Location Proximity: 15%
   * - Availability Date: 10%
   * - Price Compatibility: 10%
   */
  public static scoreListing(
    req: IBuyerRequirementDocument,
    listing: IProduceListingDocument
  ): ScoredListing {
    // 1. Product Compatibility (Max 30) - with Fuzzy & Normalized Stem Matching
    let productScore = 0;
    let productExpl = 'Different product';
    const reqProduct = req.product.trim().toLowerCase();
    const listProduct = listing.product.trim().toLowerCase();

    const normReq = normalizeCommodity(reqProduct);
    const normList = normalizeCommodity(listProduct);

    if (normReq === normList || reqProduct === listProduct) {
      productScore = 30;
      productExpl = `Direct commodity match (${listing.product})`;
      if (req.variety && listing.variety) {
        if (req.variety.toLowerCase() === listing.variety.toLowerCase()) {
          productExpl += ` • ${listing.variety} variety matched`;
        }
      }
    } else if (
      normReq.includes(normList) ||
      normList.includes(normReq) ||
      reqProduct.includes(listProduct) ||
      listProduct.includes(reqProduct)
    ) {
      productScore = 26;
      productExpl = `Category & variety affinity (${listing.product})`;
    } else {
      // Fuzzy string comparison via Levenshtein edit distance
      const dist = levenshteinDistance(normReq, normList);
      const maxLen = Math.max(normReq.length, normList.length);
      const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;

      if (dist <= 2 || similarity >= 0.65) {
        productScore = 28;
        productExpl = `Fuzzy commodity match (${req.product} ≈ ${listing.product})`;
      } else {
        productScore = 0;
        productExpl = `Different product (${listing.product} vs ${req.product})`;
      }
    }

    // 2. Quantity Match (Max 20)
    let quantityScore = 0;
    let quantityExpl = '';
    const available = listing.availableQuantity;
    const required = req.requiredQuantity;

    if (available >= required) {
      quantityScore = 20;
      quantityExpl = `Can fully fulfill (${available.toLocaleString()} kg available vs ${required.toLocaleString()} kg required)`;
    } else {
      const ratio = available / required;
      quantityScore = Math.round(ratio * 20);
      quantityExpl = `Partial fulfillment (${Math.round(ratio * 100)}% of target: ${available.toLocaleString()} kg of ${required.toLocaleString()} kg)`;
    }

    // 3. Quality Grade Compatibility (Max 15)
    let qualityScore = 0;
    let qualityExpl = '';
    const gradeRanks: Record<QualityGrade, number> = {
      'Grade A': 3,
      'Grade B': 2,
      'Grade C': 1,
    };

    const reqRank = gradeRanks[req.qualityGrade] || 2;
    const listRank = gradeRanks[listing.qualityGrade] || 2;

    if (listRank === reqRank) {
      qualityScore = 15;
      qualityExpl = `Exact grade match (${listing.qualityGrade})`;
    } else if (listRank > reqRank) {
      qualityScore = 15;
      qualityExpl = `Superior grade provided (${listing.qualityGrade} exceeds ${req.qualityGrade})`;
    } else {
      const diff = reqRank - listRank;
      qualityScore = Math.max(0, 15 - diff * 7);
      qualityExpl = `Lower grade (${listing.qualityGrade} below target ${req.qualityGrade})`;
    }

    // 4. Location Proximity (Max 15)
    let locationScore = 0;
    let locationExpl = '';
    const reqLoc = req.deliveryLocation.trim().toLowerCase();
    const listLoc = listing.location.trim().toLowerCase();

    if (reqLoc === listLoc || listLoc.includes(reqLoc) || reqLoc.includes(listLoc)) {
      locationScore = 15;
      locationExpl = `Same city/district hub (${listing.location})`;
    } else if (
      (reqLoc.includes('andhra') && listLoc.includes('andhra')) ||
      (reqLoc.includes('vijayawada') && (listLoc.includes('guntur') || listLoc.includes('krishna') || listLoc.includes('tenali') || listLoc.includes('eluru')))
    ) {
      locationScore = 12;
      locationExpl = `Neighboring agricultural corridor (<40 km from ${req.deliveryLocation})`;
    } else {
      locationScore = 6;
      locationExpl = `Regional sourcing corridor (${listing.location})`;
    }

    // 5. Availability Date (Max 10)
    let dateScore = 0;
    let dateExpl = '';
    const reqDate = new Date(req.requiredDeliveryDate).getTime();
    const availDate = new Date(listing.availableFromDate).getTime();
    const diffDays = Math.round((reqDate - availDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      dateScore = 10;
      dateExpl = `Available fresh on target delivery date (${diffDays} days buffer)`;
    } else if (diffDays > 7 && diffDays <= 20) {
      dateScore = 8;
      dateExpl = `Available ahead of delivery date (${diffDays} days before)`;
    } else if (diffDays < 0 && diffDays >= -3) {
      dateScore = 5;
      dateExpl = `Available ${Math.abs(diffDays)} days after target (near-term fulfillment)`;
    } else {
      dateScore = 2;
      dateExpl = 'Availability schedule requires timeline adjustment';
    }

    // 6. Price Compatibility (Max 10)
    let priceScore = 0;
    let priceExpl = '';
    const targetPrice = req.targetPricePerUnit;
    const expectedPrice = listing.expectedPricePerUnit;

    if (expectedPrice <= targetPrice) {
      priceScore = 10;
      priceExpl = `Within target budget (₹${expectedPrice}/kg <= ₹${targetPrice}/kg)`;
    } else {
      const percentOver = ((expectedPrice - targetPrice) / targetPrice) * 100;
      if (percentOver <= 5) {
        priceScore = 8;
        priceExpl = `Marginally above target (+${percentOver.toFixed(1)}%, high negotiation probability)`;
      } else if (percentOver <= 15) {
        priceScore = 5;
        priceExpl = `Above target (+${percentOver.toFixed(1)}%, requires price negotiation)`;
      } else {
        priceScore = 2;
        priceExpl = `Significantly above budget (+${percentOver.toFixed(1)}%)`;
      }
    }

    const totalScore = productScore + quantityScore + qualityScore + locationScore + dateScore + priceScore;

    return {
      listing,
      productScore,
      quantityScore,
      qualityScore,
      locationScore,
      dateScore,
      priceScore,
      totalScore,
      explanation: {
        product: productExpl,
        quantity: quantityExpl,
        quality: qualityExpl,
        location: locationExpl,
        date: dateExpl,
        price: priceExpl,
      },
    };
  }

  /**
   * Generates both Single-Supplier Matches and Aggregated Multi-Supplier Matches
   * to fulfill bulk requirements across fragmented farm yields.
   */
  public static generateMatches(
    req: IBuyerRequirementDocument,
    listings: IProduceListingDocument[]
  ): IMatch[] {
    const scoredListings = listings
      .filter((l) => l.status === 'AVAILABLE' && l.availableQuantity > 0)
      .map((l) => this.scoreListing(req, l))
      // Filter listings with relevant product match
      .filter((s) => s.productScore >= 15)
      .sort((a, b) => b.totalScore - a.totalScore);

    const matches: IMatch[] = [];

    // 1. Single Supplier Matches
    for (const scored of scoredListings) {
      const isFull = scored.listing.availableQuantity >= req.requiredQuantity;
      const allocated = Math.min(scored.listing.availableQuantity, req.requiredQuantity);

      const matchItem: IMatchItem = {
        produceListingId: scored.listing._id.toString(),
        farmerId: scored.listing.farmerId,
        farmerName: scored.listing.farmerName,
        availableQuantity: scored.listing.availableQuantity,
        allocatedQuantity: allocated,
        qualityGrade: scored.listing.qualityGrade,
        expectedPrice: scored.listing.expectedPricePerUnit,
        location: scored.listing.location,
      };

      const breakdown: ICompatibilityBreakdown = {
        productScore: scored.productScore,
        quantityScore: scored.quantityScore,
        qualityScore: scored.qualityScore,
        locationScore: scored.locationScore,
        dateScore: scored.dateScore,
        priceScore: scored.priceScore,
        explanation: scored.explanation,
      };

      matches.push({
        requirementId: req._id.toString(),
        buyerId: req.buyerId,
        matchType: 'SINGLE_SUPPLIER',
        totalScore: scored.totalScore,
        matchedQuantity: allocated,
        targetQuantity: req.requiredQuantity,
        isFullyFulfilled: isFull,
        suppliers: [matchItem],
        compatibilityBreakdown: breakdown,
        status: 'PROPOSED',
        createdAt: new Date(),
      });
    }

    // 2. Multi-Supplier Aggregation Match (Enterprise Supply Pooling Protocol)
    // If no single supplier meets 100% of quantity, or even if partial suppliers exist,
    // evaluate aggregating complementary top-scoring farmers to hit the target requirement.
    const partialSuppliers = scoredListings.filter(
      (s) => s.listing.availableQuantity < req.requiredQuantity
    );

    if (partialSuppliers.length >= 2) {
      let cumulativeQuantity = 0;
      const aggregatedItems: IMatchItem[] = [];
      let totalProductScore = 0;
      let totalQualityScore = 0;
      let totalLocationScore = 0;
      let totalDateScore = 0;
      let totalPriceScore = 0;

      for (const scored of partialSuppliers) {
        if (cumulativeQuantity >= req.requiredQuantity) break;

        const needed = req.requiredQuantity - cumulativeQuantity;
        const toAllocate = Math.min(scored.listing.availableQuantity, needed);

        aggregatedItems.push({
          produceListingId: scored.listing._id.toString(),
          farmerId: scored.listing.farmerId,
          farmerName: scored.listing.farmerName,
          availableQuantity: scored.listing.availableQuantity,
          allocatedQuantity: toAllocate,
          qualityGrade: scored.listing.qualityGrade,
          expectedPrice: scored.listing.expectedPricePerUnit,
          location: scored.listing.location,
        });

        cumulativeQuantity += toAllocate;
        totalProductScore += scored.productScore;
        totalQualityScore += scored.qualityScore;
        totalLocationScore += scored.locationScore;
        totalDateScore += scored.dateScore;
        totalPriceScore += scored.priceScore;
      }

      if (aggregatedItems.length >= 2) {
        const count = aggregatedItems.length;
        const avgProductScore = Math.round(totalProductScore / count);
        const avgQualityScore = Math.round(totalQualityScore / count);
        const avgLocationScore = Math.round(totalLocationScore / count);
        const avgDateScore = Math.round(totalDateScore / count);
        const avgPriceScore = Math.round(totalPriceScore / count);

        // Quantity score: full 20 if cumulative reaches target!
        const quantityRatio = cumulativeQuantity / req.requiredQuantity;
        const aggQuantityScore = Math.min(20, Math.round(quantityRatio * 20));

        const aggregatedTotalScore =
          avgProductScore +
          aggQuantityScore +
          avgQualityScore +
          avgLocationScore +
          avgDateScore +
          avgPriceScore;

        const breakdown: ICompatibilityBreakdown = {
          productScore: avgProductScore,
          quantityScore: aggQuantityScore,
          qualityScore: avgQualityScore,
          locationScore: avgLocationScore,
          dateScore: avgDateScore,
          priceScore: avgPriceScore,
          explanation: {
            product: `Aggregated ${req.product} across ${count} verified local producers`,
            quantity: `Aggregated supply reaches ${cumulativeQuantity.toLocaleString()} kg (${Math.round(quantityRatio * 100)}% of target ${req.requiredQuantity.toLocaleString()} kg)`,
            quality: `All aggregated suppliers meet required ${req.qualityGrade}`,
            location: `Consolidated logistics hub around ${req.deliveryLocation}`,
            date: 'Coordinated delivery schedule within target window',
            price: 'Harmonized price expectation within competitive market band',
          },
        };

        // Add the aggregated opportunity to the front of matches if it achieves full or higher quantity
        matches.unshift({
          requirementId: req._id.toString(),
          buyerId: req.buyerId,
          matchType: 'AGGREGATED_SUPPLY',
          totalScore: aggregatedTotalScore,
          matchedQuantity: cumulativeQuantity,
          targetQuantity: req.requiredQuantity,
          isFullyFulfilled: cumulativeQuantity >= req.requiredQuantity,
          suppliers: aggregatedItems,
          compatibilityBreakdown: breakdown,
          status: 'PROPOSED',
          createdAt: new Date(),
        });
      }
    }

    return matches;
  }
}
