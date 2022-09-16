import { extname } from 'path';

import { OnLoadArgs, OnLoadResult, Plugin, PluginBuild } from 'esbuild';
import { ImagePool, encoders } from '@squoosh/lib';

interface EncodeOptions {
    [key: string]: any
}

interface Options {
    disabled: boolean;
    extensions: RegExp;
    encodeOptions: EncodeOptions;
}

const NAMESPACE = 'esbuild-squoosh';
const CONFIG: Options = {
    disabled: false,
    extensions: /.(jpe?g|png)/,
    encodeOptions: {
        mozjpeg: 'auto',
        oxipng: 'auto'
    }
}

let Squoosh: ImagePool;

export default (options?: Options): Plugin => ({
    name: NAMESPACE,
    setup(build: PluginBuild) {
        Object.assign(CONFIG, options)

        if (! CONFIG.disabled) {
            Squoosh = new ImagePool()

            build.onLoad({filter: CONFIG.extensions, namespace: 'file'}, onLoadHandler)
            build.onEnd(async () => {
                await Squoosh.close()
            })
        }
    }
})

const onLoadHandler = async ({ path }: OnLoadArgs): Promise<OnLoadResult> => {
    const contents = await encode(path)

    return {
        contents,
        loader: 'file',
        pluginName: NAMESPACE
    }
}

const encode = async (path: string) => {
    const extension = extname(path).slice(1).toLowerCase()
    const defaultEncoder = ['mozjpeg', encoders.mozjpeg];

    // @ts-ignore: No type declarations for "encoders"
    const [encoder, {defaultEncoderOptions}] = Object.entries(encoders).find(([, encoder]) => encoder.extension === extension) || defaultEncoder

    const image = Squoosh.ingestImage(path)
    await image.encode({
        [encoder]: CONFIG.encodeOptions[encoder] || defaultEncoderOptions
    });

    return (await image.encodedWith[encoder]).binary
}
