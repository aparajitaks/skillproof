# Entity Relationship Diagram (ERD) — SkillProof (Milestone-1)

## Schema Definition (MongoDB Collections)
- **Users**: Core user collection storing identity, credentials, role, and AI usage metrics.
- **Projects**: The central entity representing a skill proof attempt, including AI evaluation data and GitHub source links.
- **Badges (Future)**: Collections for awarded credentials based on skill milestones.

## PlantUML Source
@startuml
' --- MongoDB Collections ---
entity "Users" as U {
  *_id : ObjectId <<PK>>
  --
  name : String
  email : String <<unique>>
  password : String
  role : Enum('student', 'recruiter', 'admin')
  publicProfileSlug : String <<unique>>
  aiTokensUsed : Number
}

entity "Projects" as P {
  *_id : ObjectId <<PK>>
  --
  user : ObjectId <<FK>>
  title : String
  description : String
  githubUrl : String
  techStack : Array<String>
  evaluation : Object
  finalScore : Number
  status : Enum('pending', 'evaluated', 'failed')
  createdAt : Date
}

' --- Relationships ---
U ||--o{ P : "submits and owns"
@enduml
