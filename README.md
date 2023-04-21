# Auto create a comment to PR to show Sonarcloud scan report

This action is used to show Sonarcloud scanning report to PR as a comment if your repo not bounded to Sonar Organization 

## Inputs

### `GITHUB_TOKEN`
*Already available by using secrets.GITHUB_TOKEN. To use create a comment.*

**Required**.

### `SONAR_TOKEN`
*Your Sonar access token, to call Sonarcloud API*

**Required**.


### `projectKey`
*Your Sonarcloud project key*

**Required**.

## Example workflow file
```yaml
on:
  pull_request:
    types:
      - closed
jobs:
  change_clickup_status:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    name: Sonarcloud Report
    steps:
      - name: Sonarcloud Report
        id: sonarcloud_report
        uses: minhtrong-bic/bic-sonarcloud-pr-report@1.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          projectKey: 'bic'
```