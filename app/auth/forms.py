from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, Regexp

# politica forte de senha: minimo 8, maiuscula, minuscula, numero, simbolo
strong_pwd = Regexp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$',
    message="A senha deve ter mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo."
)

class LoginForm(FlaskForm):
    email = StringField("E-mail", validators=[DataRequired(), Email()])
    password = PasswordField("Senha", validators=[DataRequired(), Length(min=6)])
    submit = SubmitField("Entrar")

class RegisterForm(FlaskForm):
    email = StringField("E-mail", validators=[DataRequired(), Email()])
    password = PasswordField("Senha", validators=[DataRequired(), strong_pwd])
    submit = SubmitField("Criar usuário")