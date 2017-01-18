---
layout: post
title:  "Implementing a Data Readiness Workflow"
date:   2017-01-17 9:00:00 -0500
summary: "An automated, repeatable, and traceable process to acquire and
          prepare data for small data science projects."
category: analytics
tags: [data, preprocessing]
---
When starting a new data science project, it is a good practice to implement
some simple data readiness steps. In this context, data readiness refers to the
acquisition, [light] preprocessing, and storage of data that will be used for
the project.

A good process can be automated and should allow traceability - which helps
when quality issues or questions about provenance arise. The process should
also provide data source consistency for team members.

The following is a simple standard for data readiness which provides a directory
structure for storing data and logic (i.e. scripts) and standards for workflow.
The workflow follows a general extract, transform, load (ETL) pattern. This is
intended for small scale projects with static data requirements. Projects that
require dynamic or near real-time data should use different methods.

## Directory Structure

The following directory structure is used to store logic and data. To make
things easier, I wrote a
[python script](https://github.com/bmweiner/hanger/tree/master/hanger/etl)
to generate this skeleton template.

  * **etl\extract** Scripts to move src files to stage/src
  * **etl\load** Scripts to load tables from stage/tbl to production system
  * **etl\local** Local storage for source files obtained manually
  * **etl\stage\src** Landing zone for raw source files
  * **etl\stage\tbl** Landing zone for final data tables
  * **etl\stage\tmp** Landing zone for intermediate processed data tables
  * **etl\transform\build** Scripts to build final tables (stage/tbl)
  * **etl\transform\prep** Scripts to preprocess src files (stage/tmp)

## Workflow

This workflow is listed in sequence of task execution [extract, transform-prep,
transform-build, load]. Dependencies should exist from task to task, but not
within a task. For multi-person teams, work can be divided by task and/or
system. For example, with systems {x,y} and staff {a,b,c}:

Table 1: divided by system

|   | E | T | L |
|---|---|---|---|
| x | a | a | a |
| y | b | b | b |

Table 2: divided by task

|   | E | T | L |
|---|---|---|---|
| x | a | b | c |
| y | a | b | c |

### Data

  * The stage is a transient area used to store files transferred from external
    systems, intermediate tables, and final tables
  * The stage is designed to be deleted or overwritten as ETL scripts
    re-create the content at runtime
  * Source files obtained manually (e.g. email attachment) should be stored in
    the `etl\local` directory
  * The `etl\local` directory should not be deleted at runtime

### Extract

| Script Repository | `etl\extract` |
| Data Source | external or `etl\local`|
| Data Destination | `etl\stage\src`|

  * An extract script transfers source files from an external source or the
    `etl\local` directory to the `etl\stage\src` directory on the local machine
  * Generally one extract script can be created for each system or file
  * Name scripts according to the external system or system and file (e.g.
    uci.py or uci_iris.py)

### Transform

  * Transform scripts prepare intermediate tables and build final tables

#### Transform - Prep

| Script Repository | `etl\transform\prep` |
| Data Source | `etl\stage\src` |
| Data Destination | `etl\stage\tmp` |

  * A prep script performs common pre-build steps on a source file such as
    format conversion and column name standardization
  * Prep scripts are useful to limit repetition in build scripts (e.g. when a
    single source file is used to build multiple tables)
  * Name scripts according to the source file (e.g. iris.py)

#### Transform - Build

| Script Repository | `etl\transform\build` |
| Data Source | `etl\stage\src` or `etl\stage\tmp` |
| Data Destination | `etl\stage\tbl` |

  * A build script creates the final table and contains steps such as joins,
    reshaping, conversion, and casting
  * A single build script should exist for each table
  * Name scripts according to the final table name (e.g. iris.py)

### Load

| Script Repository | `etl\load` |
| Data Source | `etl\stage\tbl` |
| Data Destination | data repository |

  * A load script transfers final tables from `etl\stage\tbl` to the project
    data repository, hopefully at a location all team members can access.
