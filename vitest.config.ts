import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        exclude: [
            '**\/node_modules/**',
            '**\/dist/**', 
            '**\/cypress/**', 
            '**\/.{idea,git,cache,output,temp}/**', 
            '**\/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', 
            "./dist"
        ]
    },
    define: {
        'process.env.FORCE_COLOR': '1',
    }
})