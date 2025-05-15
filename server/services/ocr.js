import { createWorker } from 'tesseract.js';

// эта хрень не работает
// не может обработать нормально языки
// не юзуйте ее

export async function recognizeText(imagePath) {

    const worker = await createWorker({
        lang: 'rus',
        workerPath: new URL('tesseract.js/worker.js', import.meta.url).href,
        corePath: new URL('tesseract.js-core/tesseract-core.wasm.js', import.meta.url).href,
        dataPath: new URL('tesseract.js-data@6.0.1', import.meta.url).href
    });

    try {

        const availableLangs = await worker.getAvailableLanguages();
        console.log('Available languages:', availableLangs);

        if (!availableLangs.includes('rus')) {
            throw new Error('Russian language not available');
        }

        await worker.setParameters({
            'tessedit_pageseg_mode': '6',
            'tessedit_char_whitelist': '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVFХЦЧШЩЪЫЬЭЮЯ+-=()',
            'preserve_interword_spaces': '1'
        });

        const { data: { text } } = await worker.recognize(imagePath);
        return text;
    } finally {
        await worker.terminate();
    }
}
