import { waitForSeconds, createStore } from './util.mjs'

// usage: const { setState, getState, subscribe, destroy } = store
// based on zustand state managemtn lib

export const store = createStore((setState, getState, api) => ({
    time: 200,
    points: undefined,
    isReloading: false,

    reload: async () => {
        await waitForSeconds(2)
        setState({ isReloading: false })
        window.RADIO.emit("reload")
    },

}))