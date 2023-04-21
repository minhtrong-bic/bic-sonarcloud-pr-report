const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

const ICON = {
    BUG: '🐞',
    CODE_SMELLS: '💩',
    SECURITY: '🔓',
    SECURITY_REVIEW: '🛡',
    DUPLICATION: '👯',
    COVERAGE: '⛅️',
}

const LABEL = {
    BUG: 'Bugs',
    CODE_SMELLS: 'Code Smell',
    SECURITY: 'Vulnerabilities',
    SECURITY_REVIEW: 'SECURITY_REVIEW',
    DUPLICATION: 'Duplications',
    COVERAGE: 'Coverage'
}

const prNumber = github.context.payload.pull_request.number;
const projectKey = core.getInput('projectKey');
const sonarToken = core.getInput('SONAR_TOKEN');
const githubToken = core.getInput('GITHUB_TOKEN')


async function execute()
{
    try {
        const comment = await getComment();
        await createComment(comment);
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function getComment() {
    const endpoint = 'https://sonarcloud.io/api/qualitygates/project_status';
    const response = await axios.get(endpoint, {
        params: {
            projectKey: projectKey,
            pullRequest: prNumber
        },
        headers: {
            authorization: `Bearer ${sonarToken}`
        }
    });


    const projectStatus = response.data.projectStatus;
    const passed = projectStatus.status === 'OK';
    const conditions = projectStatus.conditions;

    let comment = '';
    if (passed) {
        comment += 'SonarCloud Quality Gate passed! :+1: \n';
    } else {
        comment += `SonarCloud Quality Gate failed! :-1: @${github.context.actor}\n`;
    }

    conditions.forEach(condition => {
        comment += getDecoration(condition);
    })
    return comment;

}

function getDecoration(condition) {
    let icon = '', label = '', number = '', status = '';
    switch (condition.metricKey) {
        case 'new_reliability_rating':
            icon = ICON.BUG;
            label = LABEL.BUG;
            number = condition.actualValue;
            break;
        case 'new_security_rating':
            icon = ICON.SECURITY;
            label = LABEL.SECURITY;
            number = condition.actualValue;
            break;
        case 'new_maintainability_rating':
            icon = ICON.CODE_SMELLS;
            label = LABEL.CODE_SMELLS;
            number = condition.actualValue;
            break;
        case 'new_security_hotspots_reviewed':
            icon = ICON.SECURITY_REVIEW;
            label = LABEL.SECURITY_REVIEW;
            number = condition.actualValue;
            break;
        case 'new_coverage':
            label = LABEL.COVERAGE;
            icon = ICON.COVERAGE;
            number = (Math.round(condition.actualValue * 100) / 100).toString() + '%';
            break;
        case 'new_duplicated_lines_density':
            label = LABEL.DUPLICATION;
            icon = ICON.DUPLICATION;
            number = (Math.round(condition.actualValue * 100) / 100).toString() + '%';
            break;

    }

    status = condition.status === 'OK' ? ':white_check_mark:' : ':x:';
    return `${icon ? icon + ' ' : ''}${status} ${number} ${label} \n`;
}

async function createComment(comment) {
    const { owner, repo } = github.context.repo;
    const octokit = new Octokit({auth: githubToken});
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment
    });
}

execute();
