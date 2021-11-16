import { OnLoadArgs, OnLoadResult, OnResolveArgs, OnResolveResult, PluginBuild } from 'esbuild';

import { extname, isAbsolute, resolve } from 'path';
import { ImagePool, encoders } from '@squoosh/lib';

type PluginOptions = {
    disabled: boolean
    extensions: RegExp
    encodeOptions: {
        mozjpeg?: any;
        webp?: any;
        avif?: any;
        jxl?: any;
        wp2?: any;
        oxipng?: any;
    }
}

const NAMESPACE = 'esbuild-squoosh';
let Squoosh: ImagePool;
const CONFIG: PluginOptions = {
    disabled: false,
    extensions: /.*/,
    encodeOptions: {
        mozjpeg: 'auto',
        oxipng: 'auto'
    }
};

const squooshPlugin = (options?: PluginOptions) => ({
    name: NAMESPACE,
    setup: (build: PluginBuild) => {
        Object.assign(CONFIG, options);

        if (! CONFIG.disabled)
        {
            Squoosh = new ImagePool();

            build.onResolve({filter: CONFIG.extensions}, onResolveHandler)
            build.onLoad({filter: /.*/, namespace: NAMESPACE}, onLoadHandler)
            build.onEnd(async () => {
                await Squoosh.close()
            })
        }
    }
})

const onResolveHandler = async ({resolveDir, path}: OnResolveArgs): Promise<OnResolveResult> => {
    const file = isAbsolute(path) ? path : resolve(resolveDir, path);
    const extension = extname(file).slice(1).toLowerCase()

    return {
        path: file,
        namespace: NAMESPACE,
        pluginData: {
            extension
        }
    }
}

const onLoadHandler = async ({path, pluginData: {extension}}: OnLoadArgs): Promise<OnLoadResult> => {
    const contents = await encode(path, engine(extension));

    return {
        contents,
        loader: 'file'
    }
}

const encode = async (path, {encoder, options}) => {
    const image = Squoosh.ingestImage(path);
    await image.encode(options);

    return (await image.encodedWith[encoder]).binary
}

const engine = (ext: string) => {
    // @ts-ignore
    const [encoder] = Object.entries(encoders).find(([, {extension}]) => extension === ext) || ['mozjpeg']

    return {
        encoder,
        options: {
            [encoder]: CONFIG.encodeOptions[encoder]
        }
    }
}

export = squooshPlugin
