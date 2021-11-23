import { OnLoadArgs, OnLoadResult, PluginBuild } from 'esbuild';

import { extname } from 'path';
import { ImagePool, encoders } from '@squoosh/lib';

type EncodeOptions = {
    mozjpeg?: any
    webp?: any
    avif?: any
    jxl?: any
    wp2?: any
    oxipng?: any
}

type Encoder = {
    encoder: string
    encodeOptions: EncodeOptions
}

type PluginOptions = {
    disabled: boolean
    extensions: RegExp
    encodeOptions: EncodeOptions
}

const NAMESPACE = 'esbuild-squoosh';
const CONFIG: PluginOptions = {
    disabled: false,
    extensions: /.*/,
    encodeOptions: {
        mozjpeg: 'auto',
        oxipng: 'auto'
    }
};

let Squoosh: ImagePool;

const squooshPlugin = (options?: PluginOptions) => ({
    name: NAMESPACE,
    setup: (build: PluginBuild) => {
        Object.assign(CONFIG, options);

        if (! CONFIG.disabled)
        {
            Squoosh = new ImagePool();

            build.onLoad({filter: CONFIG.extensions, namespace: 'file'}, onLoadHandler)
            build.onEnd(async () => {
                await Squoosh.close()
            })
        }
    }
})

const onLoadHandler = async ({path}: OnLoadArgs): Promise<OnLoadResult> => {
    const extension = extname(path).slice(1).toLowerCase();
    const contents = await encode(path, extension);

    return {
        contents,
        loader: 'file',
        pluginName: NAMESPACE
    }
}

const encode = async (path: string, ext) => {
    // @ts-ignore: No type declarations for "encoders"
    const [encoder, {defaultEncoderOptions}] = Object.entries(encoders).find(([, {extension}]) => extension === ext) || ['mozjpeg', encoders.mozjpeg]

    const image = Squoosh.ingestImage(path);
    await image.encode({
        [encoder]: CONFIG.encodeOptions[encoder] || defaultEncoderOptions
    });

    return (await image.encodedWith[encoder]).binary
}

export = squooshPlugin
