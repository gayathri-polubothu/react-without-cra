import Axios from 'axios'
import Swal from 'sweetalert2'


const { CancelToken } = Axios

let cancelTokens = []


const cancelPreviousTokens = route => {
    // cancel the route if it already exists so we don't make multiple requests to the same thing
    const token = cancelTokens.find(x => x.route === route)
    if (token) {
        token.token()
    }
}


let canAlert = true // alert on network connection error only once, not for every failing requests
const routing = (routeType, route, postData, reqOptions = {}) => {
    const initialLocation = window.location.href // used not to alert if user navigated

    let timeout = reqOptions.timeout ?? 30000


    const options = {
        propagateError: reqOptions.propagateError ?? false,
        addSS: reqOptions.addSS ?? true,
        disableCustomerOverride: reqOptions.disableCustomerOverride ?? false,
        alertOnFail: reqOptions.alertOnFail ?? ['post', 'delete'].includes(routeType),
        refreshPageOnFail: reqOptions.refreshPageOnFail ?? false,
        propagateCancelledRequest: reqOptions.propagateCancelledRequest ?? false,
        timeout
    }

    // if expires is passed in on login. Store the value for future token refreshes
    if (route === '/hello' && routeType === 'post' && postData?.expires) {
        sessionStorage.setItem('expires', postData.expires)
    }

    postData = postData || {}

    // check if if we already have a cancel token for this route
    cancelPreviousTokens(route)
    // each route we use we add a cancel to the token store so we can cancel the request later just by messaging the service with a url to cancel
    // we store the route without anything after ? as those are query params we don't want to worry about

    // get current time
    const now = new Date().getTime()

    // wrap the axios promise inside another promise which can be queued if we are ignoring requests because a token refresh is happening
    return new Promise((resolve, reject) => {
        postData.timeRequestMade = now
        Axios[routeType](route, postData, {
            cancelToken: new CancelToken(c => {
                // check if route not already in the token store
                const splitRoute = route.split('?')[0]
                const filteredTokens = cancelTokens.filter(x => x.route === splitRoute)
                if (!filteredTokens.length) {
                    cancelTokens.push({
                        method: routeType.toUpperCase(),
                        route: route.split('?')[0],
                        token: c
                    })
                }
            }),
            timeout: options.timeout || timeout
        })
            .then(data => {
                resolve(data)
            })
            .catch(err => {
                const isTimeout =
                    err.toString() === `Error: timeout of ${Axios.defaults.timeout}ms exceeded`

                const networkError =
                    err.message?.includes('Network Error') &&
                    !err.error &&
                    !err.status &&
                    !err.response
                if (networkError) {
                    // adblockers and no network connection will return nothing
                    if (canAlert && initialLocation === window.location.href) {
                        canAlert = false
                        Swal.fire(
                            'Connection Error!',
                            'Please disable any ad blockers and/or check your network connection',
                            'error'
                        ).then(() => {
                            canAlert = true
                        })
                    }
                } else if (
                    err.response &&
                    err.response.status &&
                    err.response.status === 401 &&
                    err.response.data === 'User not found or logged out'
                ) {
                    localStorage.setItem('pageRequestedBeforeRedirect', window.location.pathname)
                    window.location.href = '/Login'
                } else if (err.response && err.response.status && err.response.status !== 304) {
                    console.log(
                        `there was an error in the service ${routeType}: `,
                        err,
                        `for route: /ss${route}`
                    )
                    console.log('error was:', err.response)
                }
                const requestCancelled = Axios.isCancel(err)
                let error = ''
                let status = 0
                if (isTimeout) {
                    error = 'Request Timeout'
                } else if (err.response && err.response.data !== undefined) {
                    error = err.response.data
                }

                if (err.response && err.response.status !== undefined) {
                    status = err.response.status
                }
                // eslint-disable-next-line prefer-promise-reject-errors
                const errorObject = {
                    message: error,
                    requestCancelled,
                    code:
                        err.response?.data?.message === 'Request failed with status code 409'
                            ? 409
                            : status
                }

                if (
                    options.propagateError &&
                    (requestCancelled ? options.propagateCancelledRequest : true)
                ) {
                    reject(errorObject)
                }

                if (
                    options.alertOnFail &&
                    !networkError &&
                    initialLocation === window.location.href &&
                    (requestCancelled ? options.propagateCancelledRequest : true)
                ) {
                    console.log('----alert on fail---', errorObject)
                } else if (
                    options.refreshPageOnFail &&
                    !networkError &&
                    initialLocation === window.location.href &&
                    (requestCancelled ? options.propagateCancelledRequest : true)
                ) {
                    console.log('----handle on error---', errorObject)                }
            })
    })
}

export const getRoute = (route, options) => routing('get', route, {}, options)

export const deleteRoute = (route, options) => routing('delete', route, {}, options)

export const postRoute = (route, data, options) => routing('post', route, data, options)

export const cancelRoute = (route, cb) => {
    const routeToCancel = route.split('?')[0]
    const tokens = cancelTokens.filter(x => x.route === routeToCancel)
    if (!tokens.length) {
        if (cb) {
            cb()
        }
        return
    }
    tokens.forEach(x => x.token())
    // remove this route from the tokenstore now it is cancelled
    cancelTokens = cancelTokens.filter(x => x.route !== routeToCancel)
    if (cb) {
        cb()
    }
}

export const cancelRoutes = routes => {
    routes.forEach(route => {
        // cancel route using cancel token from token store
        const routeToCancel = route.split('?')[0]
        const tokens = cancelTokens.filter(x => x.route === routeToCancel)
        if (!tokens.length) {
            // couldnt find route in tokenstore
            return
        }
        tokens.forEach(x => x.token())
        // remove this route from the tokenstore now it is cancelled
        cancelTokens = cancelTokens.filter(x => x.route !== routeToCancel)
    })
}

export const cancelAllRoutes = (cb = null) => {
    cancelTokens.forEach(x => {
        x.token()
    })
    if (cb) {
        cb()
    }
}
