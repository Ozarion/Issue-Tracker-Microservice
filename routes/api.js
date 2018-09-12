/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

const mongoose  =  require("mongoose");
const Schema    =  mongoose.Schema;
const ObjectId  =  mongoose.Types.ObjectId;
const CONNECTION_STRING = process.env.DB; 

module.exports = function (app) {
  
  mongoose.connect(CONNECTION_STRING);
  const db = mongoose.connection;
  
  db.on("error", console.error.bind(console, "connection error:"));
  
  db.once("open", function() {
    
    console.log("Successfully connected");
    
    const issueSchema = new Schema({
      issue_title: {type: String, required: true},
      issue_text:  {type: String, required: true},
      created_by:  {type: String, required: true},
      updated_on:  {type: Date, default: Date.now},
      created_on:  {type: Date},
      assigned_to: String,
      open:        Boolean,
      status_text: String
    });
    
    const projectSchema = new Schema({
      name:  {type: String, required: true},
      issues: [issueSchema]
    });
    
    const Project = mongoose.model("projects", projectSchema);
    
    app.route("/api/issues/:project")
    /*
    I can GET /api/issues/{projectname} for an array of all issues on that 
    specific project with all the information for each issue as was returned when posted.
    */
    .get((req, res) => {
      const projectName = req.params.project;
      const query = {"name" : projectName};
      
      Project.findOne(query)
      .exec()
      .then(project => {
        let response = [].concat(...project.issues);
        
        if ("issue_title" in req.query) {
          response = response.filter(issue => issue.issue_title === req.query.issue_title);
        }
        if ("issue_text" in req.query) {
          response = response.filter(issue => issue.issue_text === req.query.issue_text);
        }
        if ("created_by" in req.query) {
          response = response.filter(issue => issue.created_by === req.query.created_by);
        }
        if ("assigned_to" in req.query) {
          response = response.filter(issue => issue.assigned_to === req.query.assigned_to);
        }
        if ("status_text" in req.query) {
          response = response.filter(issue => issue.status_text === req.query.status_text);
        }
        if ("created_on" in req.query) {
          const queryDate = new Date(req.query.created_on);
          response = response.filter(issue => issue.created_on.toString() === queryDate.toString());
        }
        if ("updated_on" in req.query) {
          const queryDate = new Date(req.query.updated_on);
          response = response.filter(issue => issue.updated_on.toString() === queryDate.toString());
        }
        if ("open" in req.query) {
          const open = (req.query.open.toLowerCase() === "true") ? true : false;
          response = response.filter(issue => issue.open === open);
        }
        return res.json(response);
      })
      .catch(err => {
        return res.send("ERROR: ", err);
      });
    })
    /*
    I can POST /api/issues/{projectname} with form data containing required issue_title, issue_text, created_by, and
    optional assigned_to and status_text.
    The object saved (and returned) will include all of those fields (blank for optional no input) and
    also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed), and _id.
    */
    .post((req, res) => {
      const projectName = req.params.project;
        
      const query = {"name" : projectName};
      
      const newIssue  =  {
        "issue_title"   :  req.body.issue_title,
        "issue_text"    :  req.body.issue_text,
        "created_by"    :  req.body.created_by,
        "created_on"    :  new Date(),
        "updated_on"    :  new Date(),
        "open"          :  true
      };
        
      newIssue.assigned_to = (req.body.assigned_to) ? req.body.assigned_to : "";
      newIssue.status_text = (req.body.status_text) ? req.body.status_text : "";
      
      Project.findOne(query)
      .exec((err, project) => {
        if (err) {
          return res.send(err);
        }
        if (!project) {
          project = new Project({name: projectName, issues: []});
        }
        project.issues.push(newIssue);
        project.save((err, savedProject) => {
          if (err) {
            return res.json({"errors" : "required fields missing"});
          }
          // Get savedIssue from project.issues and return it
          const savedIssue = savedProject.issues.filter(issue => {
            return issue.issue_title === newIssue.issue_title 
            && issue.updated_on === newIssue.updated_on
            && issue.created_by === newIssue.created_by;
          })[0];
          return res.json(savedIssue);
        });
      });
      
    })
    /* 
    I can PUT /api/issues/{projectname} with a _id and any fields in the object with a value to object said object. 
    Returned will be 'successfully updated' or 
    'could not update '+_id. 
    This should always update updated_on. 
    If no fields are sent return 'no updated field sent'.
    */
    .put((req, res) => {
      //Build query
      const projectName = req.params.project;
      const query   = { "name": projectName };
      const id          = (req.body._id) ? req.body._id : "";
      
      if (Object.keys(req.body).length === 0) {
        return res.send("no updated field sent");
      }
      
      //Find Project
      Project.findOne(query)
      .exec((err, project) => {
        if (err) {
          return res.send(err);
        }
        if (!project) {
          return res.send(`could not update ${id}`);
        }
        // use array.map and find issue with id, update it.
        project.issues = project.issues.map((issue) => {
          if (issue._id.toString() === id) {
            issue.updated_on = new Date();
            issue.issue_title = (req.body.issue_title) ? req.body.issue_title : issue.issue_title;
            issue.issue_text = (req.body.issue_text) ? req.body.issue_text : issue.issue_text;
            issue.created_by = (req.body.created_by) ? req.body.created_by : issue.created_by;
            issue.assigned_to = (req.body.assigned_to) ? req.body.assigned_to : issue.assigned_to;
            issue.status_text = (req.body.status_text) ? req.body.status_text : issue.status_text;
            issue.open = (typeof req.body.open !== "undefined") ? req.body.open : issue.open;
          }
          return issue;
        });
        // Save project and return 
        project.save((err) => {
          if (err) {
            return res.send("could not update ${id}");
          }
          return res.send("sucessfully updated");
        });
      });
    })
      
    /* DELETE /api/issues/{projectname} with a _id to completely delete an issue. 
    If no _id is sent return '_id error', 
    success: 'deleted '+_id, 
    failed: 'could not delete '+_id. */
    .delete((req, res) => {
      const projectName = req.params.project;
      const id = (req.body._id) ? req.body._id : "";
      // If no id is sent, return with _id error
      if (id === "") {
        return res.send("_id error");
      }
      
      const query = {"name" : projectName};
      
      Project.findOne(query)
      .exec((err, project) => {
        if (err) {
          return res.send(`could not delete ${id}`);
        }
        
        // check if project is not found
        if (!project) {
          return res.send(`could not delete ${id}`);
        }
        
        // Find the issue with id
        // if present delete it with array.filter
        // save and return response
        if (project.issues.some(issue => issue._id.toString() === id)) {
          project.issues = project.issues.filter(issue => issue._id.toString() !== id);
          project.save((err) => {
            if (err) {
              return res.send(`could not delete ${id}`);
            }
            return res.send(`deleted ${id}`);
          });
        }
        else {
          return res.send(`could not delete ${id}`);
        }
        
      });
      
    }); 
    
  }); 
};