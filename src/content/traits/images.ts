export interface TraitImage {
  src: string
  alt: string
  caption: string
  credit: string
  license: string
  sourceUrl: string
  licenseUrl: string
}

// Real photographs; organism, visible feature, author, and license checked
// against each Commons file and its imageinfo metadata. All copies are resized
// and converted to WebP, without cropping. Keep attribution and license links
// visible wherever these images are used. CC BY-SA applies to the image copies,
// not automatically to the surrounding application.
export const TRAIT_IMAGES = {
  turtle: {
    src: '/images/traits/turtle.webp',
    alt: 'A painted turtle in grass, with its dark, patterned shell clearly visible.',
    caption: 'A turtle’s protective shell is part of its body.',
    credit: 'Dmitriy Aseev · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Painted_Turtle_(Chrysemys_picta)_in_grass,_Northern_Illinois_-_June,_2025.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  duck: {
    src: '/images/traits/duck.webp',
    alt: 'A male mallard balances on one orange, webbed foot on ice.',
    caption: 'Look at the duck’s wide, webbed foot.',
    credit: 'gcardinal · “Cold Feet” · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Duck_in_one_feet.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  cactus: {
    src: '/images/traits/cactus.webp',
    alt: 'Close-up of a cactus’s thick, ribbed green stem and clusters of spines.',
    caption: 'This cactus’s thick green stem stores water.',
    credit: 'Mao Piseth · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Close-up_of_green_cactus_with_spikes.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  polarBear: {
    src: '/images/traits/polar-bear.webp',
    alt: 'A polar bear walks across snow, showing its thick, pale fur.',
    caption: 'Thick fur helps a polar bear keep its body heat.',
    credit: 'Alan Wilson / naturespicsonline.com · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Polar_Bear_-_Alaska.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  katydid: {
    src: '/images/traits/katydid.webp',
    alt: 'A green katydid with leaf-shaped wings rests on a green leaf.',
    caption: 'Leaf-like wings help this katydid blend in among green leaves.',
    credit: 'Chamberlain of Nilai · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Leaf_mimic_katydid_on_leaf.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  giraffe: {
    src: '/images/traits/giraffe.webp',
    alt: 'A giraffe stands in tall grass, with its long neck visible from chest to head.',
    caption: 'A giraffe’s long neck helps it reach leaves high in trees.',
    credit: 'Miroslav Duchacek · Wikimedia Commons · resized and converted to WebP',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Giraffe_standing.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
} satisfies Record<string, TraitImage>

export type TraitImageKey = keyof typeof TRAIT_IMAGES
