
exports.BaseMiddleware = async (req, res, next) => {
    
    const start = Date.now();
    // await new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //         resolve()
    //     }, process.env.DELAY_SECONDS * 1000);
    // })

    const traffic_logger = req.app.get('traffic_logger');

    // 1. Intercept the response body
    const oldSend = res.send;
    let responseBody;

    res.send = function (data) {
        responseBody = data; // Capture the JSON/Text before it's sent
        return oldSend.apply(res, arguments);
    };


    res.on('finish', () => {
        const duration = Date.now() - start;

        // Extract device/client info
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (traffic_logger) {
            traffic_logger.log(
                {
                    method: req.method,
                    path: req.originalUrl,
                    ip: ip,
                    headers: req.headers,
                    device: deviceInfo
                },
                {
                    statusCode: res.statusCode,
                    data: responseBody // This now contains your JSON response
                },
                duration
            );
        }

        // High-visibility console log
        console.log(
            `\x1b[36m[${req.method}]\x1b[0m ${req.originalUrl} - ` +
            `Status: \x1b[32m${res.statusCode}\x1b[0m | ` +
            `Time: ${duration}ms | IP: ${ip}`
        );
    });

    next();
};


