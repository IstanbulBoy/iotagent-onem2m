/*
 * Copyright 2015 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-onem2m
 *
 * iotagent-onem2m is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-onem2m is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-onem2m.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

'use strict';

var http = require('http'),
    express = require('express'),
    logger = require('logops'),
    mustache = require('mustache'),
    uuid = require('node-uuid'),
    async = require('async'),
    request = require('request'),
    oneM2MUris = require('./oneM2MUris.json'),
    context = {
        op: 'IoTAgentOneM2M.Client'
    },
    config = require('../configService').getConfig,
    templates = require('../configService').getTemplate,
    commons = require('./commonOneM2M'),
    subscriptionServer,
    notificationHandler,
    extractBodySubscription = commons.generateBodyExtractor(
        ['RTY', 'RI', 'RN', 'PI', 'CT', 'LT', 'RSS', 'NU', 'PN', 'NCT']),
    extractBodyResource = commons.generateBodyExtractor(
        ['RTY', 'RI', 'RN', 'PI', 'CT', 'LT', 'CR', 'CNI', 'CBS', 'ST', 'CNF', 'CON', 'CS']);


/**
 * Creates the notification URI based on the information in the config service.
 *
 * @return {string}        Notification URI to be used in the subscriptions.
 */
function getNotificationUri() {
    return 'http://' + config().oneM2M.notifications.publicHost + ':' + config().oneM2M.notifications.port +
        config().oneM2M.notifications.path;
}

/**
 * Generates a handler that handles the response of a subscription creation request.
 *
 * @return {Function}          Handler for the create subscription operation.
 */
function subscriptionCreationHandler(callback) {
    return function(error, response, result) {
        if (error) {
            callback(error);
        } else {
            extractBodySubscription(commons.mapHeaders(response.headers), result, callback);
        }
    };
}

/**
 * Create a new subscription to the modification in the container given in the parameters.
 *
 * @param {String} application          Name of the AE holding the container.
 * @param {String} container            Name of the container the subscription is subscribed to.
 * @param {String} name                 Name of the subscription.
 */
function createSubscription(application, container, name, callback) {
    var parameters = {
            uri: getNotificationUri()
        },
        optionsCreateContainer = {
            uri: oneM2MUris.SubscriptionCreationTemplate
                .replace('{{Host}}', config().oneM2M.host)
                .replace('{{Port}}', config().oneM2M.port)
                .replace('{{CSEBase}}', config().oneM2M.cseBase)
                .replace('{{AEName}}', application)
                .replace('{{ContName}}', container),
            headers: {
                'X-M2M-RI': uuid.v4(),
                'X-M2M-Origin': 'Origin',
                'X-M2M-NM': name,
                'Content-Type': 'application/vnd.onem2m-res+xml;ty=23',
                'Accept': 'application/xml'
            },
            method: 'POST',
            body: mustache.render(templates('subscriptionCreationTemplate'), parameters)
        };

    logger.debug(context, 'Creating Subscription [%s] to Container [%s] for service [%s]',
        name, container, application);

    request(optionsCreateContainer, subscriptionCreationHandler(callback));
}

/**
 * Generates a handler that handles the response of a subscription retrieval request.
 *
 * @return {Function}          Handler for the get subscription operation.
 */
function subscriptionRemovalHandler(callback) {
    return function(error, response, result) {
        if (error) {
            callback(error);
        } else {
            callback();
        }
    };
}

/**
 * Remove a subscription from a container.
 *
 * @param {String} application          Name of the AE holding the container.
 * @param {String} container            Name of the container the subscription is subscribed to.
 * @param {String} name                 Name of the subscription.
 */
function removeSubscription(application, container, name, callback) {
    var optionsRemoveSubscription = {
        uri: oneM2MUris.GetSubscriptionTemplate
            .replace('{{Host}}', config().oneM2M.host)
            .replace('{{Port}}', config().oneM2M.port)
            .replace('{{CSEBase}}', config().oneM2M.cseBase)
            .replace('{{AEName}}', application)
            .replace('{{ContName}}', container)
            .replace('{{SubsName}}', name),
        headers: {
            'X-M2M-RI': uuid.v4(),
            'X-M2M-Origin': 'Origin',
            'Accept': 'application/xml'
        },
        method: 'DELETE'
    };

    logger.debug(context, 'Removing Subscription [%s] from Container [%s] for service [%s]',
        name, container, application);

    request(optionsRemoveSubscription, subscriptionRemovalHandler(callback));
}

/**
 * Generates a handler that handles the response of a subscription retrieval request.
 *
 * @return {Function}          Handler for the get subscription operation.
 */
function subscriptionGetHandler(callback) {
    return function(error, response, result) {
        if (error) {
            callback(error);
        } else {
            extractBodySubscription(commons.mapHeaders(response.headers), result, callback);
        }
    };
}

/**
 * Retrieves the subscription identified by the AE and container where it is subscribed and its name.
 *
 * @param {String} application          Name of the AE holding the container.
 * @param {String} container            Name of the container the subscription is subscribed to.
 * @param {String} name                 Name of the subscription.
 */
function getSubscription(application, container, name, callback) {
    var optionsGetSubscription = {
        uri: oneM2MUris.GetSubscriptionTemplate
            .replace('{{Host}}', config().oneM2M.host)
            .replace('{{Port}}', config().oneM2M.port)
            .replace('{{CSEBase}}', config().oneM2M.cseBase)
            .replace('{{AEName}}', application)
            .replace('{{ContName}}', container)
            .replace('{{SubsName}}', name),
        headers: {
            'X-M2M-RI': uuid.v4(),
            'X-M2M-Origin': 'Origin',
            'Accept': 'application/xml'
        },
        method: 'GET'
    };

    logger.debug(context, 'Getting Subscription [%s] in container [%s] for service [%s]', name, container, application);

    request(optionsGetSubscription, subscriptionGetHandler(callback));
}

/**
 * Sets the custom notification handler for the notification server.
 *
 * @param {Function} newHandler         Notification handler to process incoming notifications.
 */
function setNotificationHandler(newHandler) {
    notificationHandler = newHandler;
}

/**
 * Generic express middleware to handle the incoming notifications. If a custom notification handler has been
 * established, it invokes that notification handler. Otherwise, it invokes an empty notification handler that returns
 * a 200OK code.
 */
function handleNotification(req, res, next) {
    var handler;

    function sendResult(result, callback) {
        res.status(200).send(result);
    }

    function emptyHandler(body, callback) {
        callback(null, body || '{}');
    }

    if (notificationHandler) {
        handler = notificationHandler;
    } else {
        handler = emptyHandler;
    }

    async.waterfall([
        async.apply(extractBodyResource, {}, req.body),
        handler,
        sendResult
    ], next);
}

/**
 * Error handling middleware for notification routes.
 */
function handleNotificationError(error, req, res, next) {
    var code = 500;

    logger.debug(context, 'Error [%s] handing request: %s', error.name, error.message);

    res.status(code).json({
        name: error.name,
        message: error.message
    });
}

/**
 * Express middleware that reads the body from the request stream and stores it in the 'req.body' object of the request.
 */
function readBody(req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
        req.body = data;
        next();
    });
}

/**
 * Starts the notification server, with the parameters found in the configuration object ('notifications' subobject).
 */
function start(callback) {
    subscriptionServer = {
        server: null,
        app: express(),
        router: express.Router()
    };

    logger.info(context, 'Starting subscriptions server on port [%s]', config().oneM2M.notifications.port);
    logger.debug(context, 'Using config:\n\n%s\n', JSON.stringify(config().oneM2M.notifications, null, 4));

    subscriptionServer.app.set('port', config().oneM2M.notifications.port);
    subscriptionServer.app.set('host', '0.0.0.0');
    subscriptionServer.router.post('/notifications', readBody, handleNotification);

    subscriptionServer.app.use('/', subscriptionServer.router);
    subscriptionServer.app.use(handleNotificationError);

    subscriptionServer.server = http.createServer(subscriptionServer.app);

    subscriptionServer.server.listen(subscriptionServer.app.get('port'), subscriptionServer.app.get('host'), callback);
}

/**
 * Stops the notification server.
 */
function stop(callback) {
    logger.info(context, 'Stopping subscriptions server');

    subscriptionServer.server.close(callback);
}

exports.create = createSubscription;
exports.remove = removeSubscription;
exports.get = getSubscription;
exports.start = start;
exports.stop = stop;
exports.setNotificationHandler = setNotificationHandler;
