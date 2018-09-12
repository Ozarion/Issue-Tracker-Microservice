/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
      
      test('Every field filled in', function(done) {
       const testIssue = {
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        }
       chai.request(server)
        .post('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, testIssue.issue_title, "res issue_title should be 'Title'");
          assert.equal(res.body.issue_text, testIssue.issue_text, "res issue_text should be 'text");
          assert.equal(res.body.created_by, testIssue.created_by, "res created_by correct");
          assert.equal(res.body.assigned_to, testIssue.assigned_to, "res assigned_to correct");
          assert.equal(res.body.status_text, testIssue.status_text, "res status_text correct");
          assert.isDefined(res.body._id, "_id is defined");
          done();
        });
      });
      
      test('Required fields filled in', function(done) {
        const testIssue = {
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in'
        };
       chai.request(server)
        .post('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, testIssue.issue_title, "res issue_title should be 'Title'");
          assert.equal(res.body.issue_text, testIssue.issue_text, "res issue_text should be 'text");
          assert.equal(res.body.created_by, testIssue.created_by, "res created_by correct");
          assert.isDefined(res.body._id, "_id is defined");
          done();
        });
      });
      
      test('Missing required fields', function(done) {
        const testIssue = {
          issue_text: 'text with no title',
          status_text: 'not insertable'
        };
        chai.request(server)
        .post('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.errors, "required fields missing", "correct");
          done();
        });
      });
      
    });
    
    suite('PUT /api/issues/{project} => text', function() {
      
      test('No body', function(done) {
        const testIssue = {};
        
        chai.request(server)
        .put('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, "no updated field sent");
          done();
        });
      });
      
      test('One field to update', function(done) {
        const testIssue = {
          assigned_to: 'odinbot'
        };
        
        chai.request(server)
        .put('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, "sucessfully updated");
          done();
        });
      });
      
      test('Multiple fields to update', function(done) {
        const testIssue = {
          assigned_to: 'odinbot',
          issue_text: 'updated text'
        };
        
        chai.request(server)
        .put('/api/issues/test')
        .send(testIssue)
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, "sucessfully updated");
          done();
        });
      });
      
    });
    
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
      });
      
      test('One filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({open:true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          for (let issue of res.body) {
            assert.equal(issue.open, true, "open is true");
            assert.property(issue, '_id');
          }
          done();
        });
      });
      
      test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({open:true, assigned_to: "Chai and Mocha"})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          for (let issue of res.body) {
            assert.equal(issue.open, true, "open is true");
            assert.equal(issue.assigned_to, "Chai and Mocha", "assigned_to correct");
            assert.property(issue, '_id');
          }
          done();
        });
      });
      
    });
    
    suite('DELETE /api/issues/{project} => text', function() {
      
      test('No _id', function(done) {
        chai.request(server)
        .delete('/api/issues/test')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, "_id error");
          done();
        });
      });
      
      test('Valid _id', function(done) {
        chai.request(server)
        .delete('/api/issues/test')
        .send({_id:"5b994bc6ffb50625d13303da"})
        .end(function(err, res){
          assert.equal(res.status, 200);
          //assert.include(res.text, "5b994bc6ffb50625d13303da");
          console.log(res.text);
          done();
        });
      });
      
    });

});
