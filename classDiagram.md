# Class Diagram — SkillProof Backend (Milestone-1)

## Architecture Layers
- **Controller**: Handles HTTP request parsing and response delivery.
- **Service**: Implements core business logic and AI evaluation orchestration.
- **Repository**: Provides a clean interface for data persistence (MongoDB/Mongoose).
- **Model**: Defines the data schema and inheritance for User roles.

## PlantUML Source
@startuml
' --- Models ---
abstract class User {
  +UUID id
  +String name
  +String email
  +String password
  +Integer aiTokensUsed
  +register()
  +login()
}

class Student {
  +Project[] projects
  +Badge[] badges
  +viewLeaderboard()
}

class Recruiter {
  +String organization
  +verifySkills()
}

class Admin {
  +manageUsers()
  +systemConfig()
}

class Project {
  +UUID id
  +String title
  +String githubUrl
  +Object evaluation
  +Float finalScore
}

' --- Infrastructure ---
interface BaseRepository {
  +findAll()
  +findById()
  +create()
  +update()
  +delete()
}

class UserRepository {
  +findByEmail()
  +findBySlug()
}

class ProjectRepository {
  +findByUserId()
  +findPublicProjects()
}

' --- Relationships ---
User <|-- Student
User <|-- Recruiter
User <|-- Admin

Student "1" -- "*" Project : owns
BaseRepository <|-- UserRepository
BaseRepository <|-- ProjectRepository
UserRepository ..> User : persists
ProjectRepository ..> Project : persists

@enduml
