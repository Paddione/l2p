-- Question sets table
CREATE TABLE IF NOT EXISTS question_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_by VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    question_count INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_sets_name ON question_sets(name);
CREATE INDEX IF NOT EXISTS idx_question_sets_created_by ON question_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_question_sets_public ON question_sets(is_public);

-- Create trigger to automatically update updated_at for question_sets
DROP TRIGGER IF EXISTS update_question_sets_updated_at ON question_sets;
CREATE TRIGGER update_question_sets_updated_at
    BEFORE UPDATE ON question_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 