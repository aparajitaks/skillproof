# Sequence Diagram — AI Project Evaluation Flow (Milestone-1)

## Flow Description
1. **User Request**: Student submits a project via the frontend with Title, Description, Tech Stack, and GitHub URL.
2. **Controller Layer**: Receives the POST request, validates the JWT, and parses the request body.
3. **Service Layer**: Orchestrates the evaluation. It first attempts to fetch the code context from GitHub.
4. **AI Processing**: The project context is sent to the AI service (Groq/LLM) for evaluation against predefined criteria.
5. **Score Calculation**: The AI response is parsed, and a final score is calculated using the weighted scoring utility.
6. **Repository Persistence**: The evaluation results and final score are saved to the database via the Project Repository.
7. **User Update**: AI token usage is tracked and updated on the User account.

## PlantUML Source
@startuml
actor Student
boundary "Frontend (React)" as FE
control "ProjectController" as PC
participant "ProjectService" as PS
participant "GitHubService" as GHS
participant "AIService (Groq)" as AIS
entity "ProjectRepository" as PR
database "MongoDB" as DB

Student -> FE : Submit Project
FE -> PC : POST /api/projects
PC -> PS : runProjectEvaluation(data)

PS -> GHS : fetchRepoContext(githubUrl)
GHS --> PS : code_context

PS -> AIS : evaluateProject(projectData, code_context)
AIS --> PS : evaluation_json

PS -> PR : create(evaluation_results)
PR -> DB : INSERT Project
DB --> PR : saved_project

PS -> PR : updateTokenUsage(userId, tokens)
PR -> DB : UPDATE User
DB --> PR : updated_user

PS --> PC : project_result
PC --> FE : JSON success(project)
FE --> Student : Display Evaluation Result
@enduml
