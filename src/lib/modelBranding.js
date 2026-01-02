// Model Branding Mapping
// Maps technical model names to branded names

export const MODEL_BRANDING = {
    // Image Models
    'MobileNet': 'MintPix o-Mini',
    'mobilenet': 'MintPix o-Mini',
    'InceptionV3': 'SuperMint High',
    'inceptionv3': 'SuperMint High',

    // Pose Models
    'MoveNet': 'MintPoseV1',
    'movenet': 'MintPoseV1',

    // Text Models
    'Universal Sentence Encoder': 'MintLineV1',
    'USE': 'MintLineV1',
    'universal-sentence-encoder': 'MintLineV1'
};

// Get branded name for a model
export const getBrandedModelName = (technicalName) => {
    if (!technicalName) return '';

    // Check direct match first
    if (MODEL_BRANDING[technicalName]) {
        return MODEL_BRANDING[technicalName];
    }

    // Check case-insensitive match
    const lowerName = technicalName.toLowerCase();
    for (const [key, value] of Object.entries(MODEL_BRANDING)) {
        if (key.toLowerCase() === lowerName) {
            return value;
        }
    }

    // Return original if no match found
    return technicalName;
};

// Get technical name from branded name (reverse lookup)
export const getTechnicalModelName = (brandedName) => {
    if (!brandedName) return '';

    for (const [technical, branded] of Object.entries(MODEL_BRANDING)) {
        if (branded === brandedName) {
            return technical;
        }
    }

    // Return original if no match found
    return brandedName;
};

// Model descriptions for UI
export const MODEL_DESCRIPTIONS = {
    'MintPix o-Mini': 'Fast and efficient image classification model',
    'SuperMint High': 'High-accuracy image classification with advanced features',
    'MintPoseV1': 'Real-time human pose detection and tracking',
    'MintLineV1': 'Advanced text understanding and classification'
};

export default {
    MODEL_BRANDING,
    getBrandedModelName,
    getTechnicalModelName,
    MODEL_DESCRIPTIONS
};
