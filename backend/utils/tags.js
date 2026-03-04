
// List of allowed tags (for filtering request input)
export const allowedTags = [
    "couple", "threesome", "fmf", "mfm", "orgy", "gangbang",
    "straight", "anal", "facial", "cumshot", "creampie",
    "analCreampie", "dp", "squirting", "cumSwap", "cumSwallow",
    "piss", "favourite"
];

// Default tag values (all false)
export const defaultTags = allowedTags.reduce((acc, tag) => {
    acc[tag] = false;
    return acc;
}, {});
