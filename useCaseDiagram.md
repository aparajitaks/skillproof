# Use Case Diagram — SkillProof (Milestone-1)

## Actors
- **Student**: Submits projects for AI evaluation, manages personal dashboard, earns skill badges.
- **Recruiter**: Views verified student profiles, evaluates technical depth of candidates.
- **Admin**: Manages system users, monitors AI token usage, handles flagged evaluations.

## Use Cases
1. **User Identity Management**: Register, Login, Profile setup (All Actors).
2. **Project Evaluation Flow**: Submit project, Fetch GitHub code, Request AI analysis (Student).
3. **Skill Visualization**: View evaluation score, View technical feedback, View Leaderboard (Student/Recruiter).
4. **Talent Discovery**: Search students by tech stack, Compare project scores (Recruiter).

## PlantUML Source
@startuml
left to right direction
actor "Student" as S
actor "Recruiter" as R
actor "Admin" as A

package "SkillProof Core" {
  usecase "Register & Login" as UC1
  usecase "Submit Project for Evaluation" as UC2
  usecase "View Evaluation Feedback" as UC3
  usecase "Search Talent by Tech Stack" as UC4
  usecase "Monitor System AI Usage" as UC5
  usecase "View Global Leaderboard" as UC6
}

S --> UC1
S --> UC2
S --> UC3
S --> UC6

R --> UC1
R --> UC4
R --> UC6

A --> UC1
A --> UC5
@enduml
