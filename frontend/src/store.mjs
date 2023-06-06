import { waitForSeconds, createStore } from './util.mjs'

export const store = createStore((setState, getState, api) => ({
    time: 200,
    ammo: ["🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈"],
    points: undefined,
    isReloading: false,

    shoot: async () => {
        const old = getState()

        // if ammo empty reload instead
        if(old.ammo.length === 0 && old.isReloading !== true){
            window.RADIO.emit("shoot::empty")
            setState({ isReloading: true })
            await api.dispatch("reload")
            return
        }

        if(old.ammo.length === 0 && old.isReloading === true){
            window.RADIO.emit("shoot::empty")
            return
        }

        if(!old.isReloading){
            window.RADIO.emit("shoot")
            old.ammo.shift()
            setState({ammo: JSON.parse(JSON.stringify(old.ammo))})
            return
        }

        return
    },

    reload: async () => {
        await waitForSeconds(2)
        setState({ ammo: ["🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈","🏳️‍🌈"], isReloading: false })
        window.RADIO.emit("reload")
    },

    spawn: () => {}

}))

// const { setState, getState, subscribe, destroy } = store
