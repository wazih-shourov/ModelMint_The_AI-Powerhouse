import { supabase } from './supabaseClient';

/**
 * Upload model files to Supabase Storage
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {Object} modelData - Model data containing model, metadata, and weights
 * @returns {Promise<Object>} - File paths in storage
 */
export const uploadModelFiles = async (userId, projectId, modelData) => {
    try {
        const { model, metadata } = modelData;

        // Create folder path: userId/projectId/
        const folderPath = `${userId}/${projectId}`;

        console.log('Saving model artifacts:', {
            hasModelTopology: !!model.modelTopology,
            hasWeightSpecs: !!model.weightSpecs,
            hasWeightData: !!model.weightData
        });

        // 1. Save model.json (complete TensorFlow format)
        const modelJsonContent = {
            modelTopology: model.modelTopology,
            weightsManifest: [{
                paths: ['model.weights.bin'],
                weights: model.weightSpecs || []
            }],
            format: 'layers-model',
            generatedBy: 'ModelMint 1.0',
            convertedBy: null
        };

        const modelJson = JSON.stringify(modelJsonContent);
        const modelBlob = new Blob([modelJson], { type: 'application/json' });
        const modelPath = `${folderPath}/model.json`;

        console.log('Uploading model.json:', {
            size: modelBlob.size,
            weightsManifestLength: modelJsonContent.weightsManifest[0].weights.length
        });

        const { error: modelError } = await supabase.storage
            .from('model-files')
            .upload(modelPath, modelBlob, {
                contentType: 'application/json',
                upsert: true
            });

        if (modelError) throw modelError;

        // 2. Save metadata.json
        const metadataJson = JSON.stringify(metadata);
        const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
        const metadataPath = `${folderPath}/metadata.json`;

        const { error: metadataError } = await supabase.storage
            .from('model-files')
            .upload(metadataPath, metadataBlob, {
                contentType: 'application/json',
                upsert: true
            });

        if (metadataError) throw metadataError;

        // 3. Save weights (binary file)
        const weightsBlob = new Blob([model.weightData], { type: 'application/octet-stream' });
        const weightsPath = `${folderPath}/model.weights.bin`;

        console.log('Uploading weights:', {
            size: weightsBlob.size
        });

        const { error: weightsError } = await supabase.storage
            .from('model-files')
            .upload(weightsPath, weightsBlob, {
                contentType: 'application/octet-stream',
                upsert: true
            });

        if (weightsError) throw weightsError;

        // 4. Save embeddings (if provided)
        let embeddingsPath = null;
        if (modelData.embeddings) {
            const embeddingsJson = JSON.stringify(modelData.embeddings);
            const embeddingsBlob = new Blob([embeddingsJson], { type: 'application/json' });
            embeddingsPath = `${folderPath}/embeddings.json`;

            console.log('Uploading embeddings:', {
                size: embeddingsBlob.size
            });

            const { error: embeddingsError } = await supabase.storage
                .from('model-files')
                .upload(embeddingsPath, embeddingsBlob, {
                    contentType: 'application/json',
                    upsert: true
                });

            if (embeddingsError) throw embeddingsError;
        }

        // Return file paths
        return {
            modelPath,
            metadataPath,
            weightsPath,
            embeddingsPath,
            uploadedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error uploading model files:', error);
        throw error;
    }
};

/**
 * Load model files from Supabase Storage
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Model data
 */
export const loadModelFiles = async (userId, projectId) => {
    try {
        const folderPath = `${userId}/${projectId}`;

        console.log('Loading model files from:', folderPath);

        // 1. Download model.json
        const { data: modelData, error: modelError } = await supabase.storage
            .from('model-files')
            .download(`${folderPath}/model.json`);

        if (modelError) {
            console.error('Model download error:', modelError);
            throw modelError;
        }

        // 2. Download metadata.json
        const { data: metadataData, error: metadataError } = await supabase.storage
            .from('model-files')
            .download(`${folderPath}/metadata.json`);

        if (metadataError) {
            console.error('Metadata download error:', metadataError);
            throw metadataError;
        }

        // 3. Download weights
        const { data: weightsData, error: weightsError } = await supabase.storage
            .from('model-files')
            .download(`${folderPath}/model.weights.bin`);

        if (weightsError) {
            console.error('Weights download error:', weightsError);
            throw weightsError;
        }

        // 4. Download embeddings (optional)
        let embeddings = null;
        try {
            const { data: embeddingsData, error: embeddingsError } = await supabase.storage
                .from('model-files')
                .download(`${folderPath}/embeddings.json`);

            if (!embeddingsError && embeddingsData) {
                embeddings = JSON.parse(await embeddingsData.text());
                console.log('Embeddings loaded successfully');
            }
        } catch (e) {
            console.log('No embeddings found or error loading them (this is fine for old models)');
        }

        // Parse JSON files
        const modelJson = JSON.parse(await modelData.text());
        const metadata = JSON.parse(await metadataData.text());
        const weightData = await weightsData.arrayBuffer();

        // Extract weight specs from model topology
        let weightSpecs = [];
        if (modelJson.weightsManifest && modelJson.weightsManifest.length > 0) {
            weightSpecs = modelJson.weightsManifest[0].weights;
        }

        console.log('Files loaded successfully:', {
            modelTopology: !!modelJson,
            metadata: !!metadata,
            weightDataSize: weightData.byteLength,
            weightSpecsCount: weightSpecs.length,
            hasEmbeddings: !!embeddings
        });

        return {
            model: {
                modelTopology: modelJson,
                weightSpecs: weightSpecs,
                weightData: weightData
            },
            metadata,
            embeddings
        };
    } catch (error) {
        console.error('Error loading model files:', error);
        throw error;
    }
};

/**
 * Delete model files from Supabase Storage
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 */
export const deleteModelFiles = async (userId, projectId) => {
    try {
        const folderPath = `${userId}/${projectId}`;

        const filesToDelete = [
            `${folderPath}/model.json`,
            `${folderPath}/metadata.json`,
            `${folderPath}/model.weights.bin`
        ];

        const { error } = await supabase.storage
            .from('model-files')
            .remove(filesToDelete);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting model files:', error);
        throw error;
    }
};

/**
 * Get public URLs for model files
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Object} - Public URLs
 */
export const getModelFileUrls = (userId, projectId) => {
    const folderPath = `${userId}/${projectId}`;

    const { data: modelUrl } = supabase.storage
        .from('model-files')
        .getPublicUrl(`${folderPath}/model.json`);

    const { data: metadataUrl } = supabase.storage
        .from('model-files')
        .getPublicUrl(`${folderPath}/metadata.json`);

    const { data: weightsUrl } = supabase.storage
        .from('model-files')
        .getPublicUrl(`${folderPath}/model.weights.bin`);

    return {
        modelUrl: modelUrl.publicUrl,
        metadataUrl: metadataUrl.publicUrl,
        weightsUrl: weightsUrl.publicUrl
    };
};
