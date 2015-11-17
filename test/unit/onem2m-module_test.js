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

var aeMgmt = require('../../lib/services/oneM2M/aeService'),
    nock = require('nock'),
    should = require('should'),
    utils = require('../tools/utils'),
    config = require('./testConfig'),
    oneM2MMock;

describe('OneM2M module', function() {
    describe('When a user creates a new Application Entity', function() {
        var expectedResult = {
            rty: '2',
            ri: 'AE00000000000000000048',
            rn: 'SmartGondor',
            pi: 'Mobius',
            ct: '2015-11-16T15:05:23+01:00',
            lt: '2015-11-16T15:05:23+01:00',
            api: 'SmartGondor',
            aei: 'S00000000000000000048',
            poa: '',
            rsc: '2001'
            };

        beforeEach(function(done) {
            nock.cleanAll();

            oneM2MMock = nock('http://mockedOneM2M.com:4567')
                .matchHeader('X-M2M-RI', /^[a-f0-9\-]*$/)
                .matchHeader('X-M2M-Origin', 'Origin')
                .matchHeader('X-M2M-NM', 'SmartGondor')
                .post('/Mobius', utils.readExampleFile('./test/unit/oneM2MRequests/AECreation.xml', true))
                .reply(
                    200,
                    utils.readExampleFile('./test/unit/oneM2MResponses/AECreationSuccess.xml', true),
                    {
                        'X-M2M-RI': '123450e17f923-a5b0-436a-b7f2-4a17d0c1410b',
                        'X-M2M-RSC': '2001'
                    });

            aeMgmt.init(config, done);
        });

        it('should send an XML creation request to the OneM2M endpoint', function(done) {
            aeMgmt.createAE('SmartGondor', function(error, result) {
                should.not.exist(error);
                oneM2MMock.done();
                done();
            });
        });

        it('should return all the response fields', function(done) {
            aeMgmt.createAE('SmartGondor', function(error, result) {
                should.exist(result);
                result.should.deepEqual(expectedResult);
                done();
            });
        });
    });
    describe('When a user removes an Application Entity', function() {
        beforeEach(function(done) {
            nock.cleanAll();

            oneM2MMock = nock('http://mockedOneM2M.com:4567')
                .matchHeader('X-M2M-RI', /^[a-f0-9\-]*$/)
                .matchHeader('X-M2M-Origin', 'Origin')['delete']('/Mobius/AE-SmartGondor')
                .reply(
                200,
                {
                    'X-M2M-RI': '123450e17f923-a5b0-436a-b7f2-4a17d0c1410b',
                    'X-M2M-RSC': '2002'
                });

            aeMgmt.init(config, done);
        });

        it('should send an XML remove request to the OneM2M endpoint', function(done) {
            aeMgmt.removeAE('SmartGondor', function(error, result) {
                should.not.exist(error);
                oneM2MMock.done();
                done();
            });
        });
    });
    describe('When a user creates a container', function() {
        it('should send an create content instance with type container to the OneM2M endpoint');
    });
    describe('When a user gets a container', function() {
        it('should return all the information from the container');
    });
    describe('When a user removes a container', function() {
        it('should send an remove content instance for the selected container to the OneM2M endpoint');
    });
    describe('When a user creates a resource', function() {
        it('should send an create content instance with type resource to the OneM2M endpoint');
    });
    describe('When a user removes a resource', function() {
        it('should send an remove content instance for the selected resource to the OneM2M endpoint');
    });
});
