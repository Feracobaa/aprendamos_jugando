-- Supabase PostgreSQL Schema para Plataforma Aprendamos Jugando (Lectura Crítica)
-- Ejecuta este código en el "SQL Editor" de Supabase

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'estudiante' CHECK (role IN ('admin','estudiante','profesor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  foto_perfil VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);  

CREATE TABLE examenes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  admin_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fase_lectura VARCHAR(50) CHECK (fase_lectura IN ('literal', 'inferencial', 'critico')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tiempo_limite INT DEFAULT 60,
  intentos_permitidos INT DEFAULT 2,
  es_global BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  publicado BOOLEAN DEFAULT true
);

CREATE TABLE exam_settings (
  examen_id INT PRIMARY KEY REFERENCES examenes(id) ON DELETE CASCADE,
  mostrar_resultados BOOLEAN DEFAULT true,
  mezclar_preguntas BOOLEAN DEFAULT false,
  mezclar_opciones BOOLEAN DEFAULT false,
  permitir_regresar BOOLEAN DEFAULT true,
  mostrar_respuestas_correctas BOOLEAN DEFAULT false,
  ventana_completa_obligatoria BOOLEAN DEFAULT false,
  detectar_cambio_pestana BOOLEAN DEFAULT true
);

CREATE TABLE preguntas (
  id SERIAL PRIMARY KEY,
  examen_id INT NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  imagen VARCHAR(255),
  opcion_a VARCHAR(255) NOT NULL,
  imagen_opcion_a VARCHAR(255),
  opcion_b VARCHAR(255) NOT NULL,
  imagen_opcion_b VARCHAR(255),
  opcion_c VARCHAR(255) NOT NULL,
  imagen_opcion_c VARCHAR(255),
  opcion_d VARCHAR(255) NOT NULL,
  imagen_opcion_d VARCHAR(255),
  respuesta_correcta VARCHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A','B','C','D')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  explicacion_correcta TEXT,
  explicacion_a TEXT,
  explicacion_b TEXT,
  explicacion_c TEXT,
  explicacion_d TEXT,
  referencias VARCHAR(500),
  nivel_dificultad VARCHAR(50) DEFAULT 'medio' CHECK (nivel_dificultad IN ('fácil','medio','difícil'))
);

CREATE TABLE resultados (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  examen_id INT NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  puntaje INT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_responses (
  id SERIAL PRIMARY KEY,
  resultado_id INT NOT NULL REFERENCES resultados(id) ON DELETE CASCADE,
  pregunta_id INT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  respuesta_estudiante VARCHAR(1) CHECK (respuesta_estudiante IN ('A','B','C','D')),
  es_correcta BOOLEAN,
  tiempo_respuesta INT
);

CREATE TABLE exam_progress (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  examen_id INT NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  pregunta_id INT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  respuesta_seleccionada VARCHAR(1) CHECK (respuesta_seleccionada IN ('A','B','C','D')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (estudiante_id, examen_id, pregunta_id)
);

CREATE TABLE active_exam_sessions (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL,
  examen_id INT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ultimo_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  finalizada BOOLEAN DEFAULT false,
  UNIQUE (estudiante_id, examen_id, finalizada)
);

CREATE TABLE exam_audit_log (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL,
  examen_id INT NOT NULL,
  evento_tipo TEXT,
  detalles JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_statistics (
  pregunta_id INT PRIMARY KEY REFERENCES preguntas(id) ON DELETE CASCADE,
  total_respuestas INT DEFAULT 0,
  respuestas_correctas INT DEFAULT 0,
  respuestas_a INT DEFAULT 0,
  respuestas_b INT DEFAULT 0,
  respuestas_c INT DEFAULT 0,
  respuestas_d INT DEFAULT 0,
  tiempo_promedio_respuesta REAL,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE
);

CREATE TABLE feedback_analytic (
  id SERIAL PRIMARY KEY,
  pregunta_id INT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  estudiante_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  respuesta_incorrecta CHAR(1),
  viewed_feedback BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE simulacros (
  id SERIAL PRIMARY KEY,
  estudiante_id INT REFERENCES usuarios(id),
  inicio TIMESTAMP WITH TIME ZONE,
  fin TIMESTAMP WITH TIME ZONE,
  estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo','completado','terminado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actualizado_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE simulacro_respuestas (
  id SERIAL PRIMARY KEY,
  simulacro_id INT REFERENCES simulacros(id) ON DELETE CASCADE,
  pregunta_id INT REFERENCES preguntas(id),
  respuesta VARCHAR(1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (simulacro_id, pregunta_id)
);

CREATE TABLE simulacro_resultados (
  id SERIAL PRIMARY KEY,
  simulacro_id INT UNIQUE REFERENCES simulacros(id) ON DELETE CASCADE,
  estudiante_id INT REFERENCES usuarios(id),
  puntaje_total DECIMAL(5,2),
  respuestas_correctas INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
